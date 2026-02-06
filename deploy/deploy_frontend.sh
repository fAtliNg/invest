#!/bin/bash
set -e

# deploy_frontend.sh - Деплой фронтенда с удаленной сборкой
# Использование: ./deploy/deploy_frontend.sh [user@host] [password]

TARGET=""
PASSWORD=""
DOMAIN=""
PROJECT_DIR="invest"
IMAGE_NAME="invest-frontend:latest"
TAR_NAME="frontend_src.tar.gz"
LOCAL_DIR=$(pwd)

while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--password)
      PASSWORD="$2"
      shift 2
      ;;
    -d|--domain)
      DOMAIN="$2"
      shift 2
      ;;
    *)
      if [ -z "$TARGET" ]; then
        TARGET="$1"
      fi
      shift
      ;;
  esac
done

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <user@host> [-p password] [-d domain]"
  exit 1
fi

if [ -z "$DOMAIN" ]; then
    read -p "Введите доменное имя (например, example.com): " DOMAIN
fi

if [ -z "$DOMAIN" ]; then
    echo "❌ Ошибка: Домен обязателен для настройки SSL!"
    exit 1
fi

# Определение окружения (dev/prod)
IS_DEV="false"
if [ "$DOMAIN" = "profit-case-dev.ru" ]; then
    IS_DEV="true"
    echo "🔧 Режим: DEV (индексация будет запрещена)"
else
    echo "🔧 Режим: PROD (индексация разрешена)"
fi

HOST=$(echo $TARGET | cut -d@ -f2)

# Проверка, что мы в корне проекта
if [ ! -f "$LOCAL_DIR/package.json" ]; then
    echo "❌ Ошибка: Запускайте скрипт из корня проекта!"
    echo "Пример: ./deploy/deploy_frontend.sh root@1.2.3.4"
    exit 1
fi

# Настройка SSH подключения (Интерактивный режим / Multiplexing)
echo "🔑 Установка соединения с $TARGET..."

SOCKET="/tmp/ssh_deploy_$$"

# Функция для запуска ssh с паролем или без
start_ssh_master() {
    if [ -n "$PASSWORD" ]; then
        if ! command -v sshpass &> /dev/null; then
            echo "❌ sshpass не установлен. Установите его или используйте SSH ключи."
            exit 1
        fi
        export SSHPASS="$PASSWORD"
        sshpass -e ssh -o ControlPersist=600 -o ServerAliveInterval=60 -M -S "$SOCKET" -fN -o StrictHostKeyChecking=no "$TARGET"
    else
        echo "👉 Если используется пароль, введите его ОДИН раз."
        ssh -o ControlPersist=600 -o ServerAliveInterval=60 -M -S "$SOCKET" -fN -o StrictHostKeyChecking=no "$TARGET"
    fi
}

# Создаем мастер-соединение в фоне
start_ssh_master
if [ $? -ne 0 ]; then
    echo "❌ Не удалось установить соединение."
    exit 1
fi

# Автоудаление сокета при выходе
trap "ssh -S \"$SOCKET\" -O exit \"$TARGET\" 2>/dev/null" EXIT

SSH_CMD="ssh -S $SOCKET"
SCP_CMD="scp -o ControlPath=$SOCKET"

echo "🚀 Начинаем деплой фронтенда на $TARGET..."

# 1. Локальная сборка и упаковка артефактов
echo "🏗 Локальная сборка фронтенда (SSR)..."
NEXT_PUBLIC_WS_URL="wss://$DOMAIN/api/ws"
export NEXT_PUBLIC_WS_URL
export NEXT_PUBLIC_IS_DEV="$IS_DEV"
if [ ! -d "node_modules" ]; then
  npm ci --legacy-peer-deps
fi
npm run build
echo "📦 Упаковка исходников с готовым билдом (.next)..."
COPYFILE_DISABLE=1 tar --exclude=node_modules -czf "$TAR_NAME" .

# 2. Отправка архива на сервер
echo "📤 Отправка исходного кода на сервер..."
$SSH_CMD "$TARGET" "mkdir -p ~/$PROJECT_DIR/deploy"
$SCP_CMD "$TAR_NAME" "$TARGET:~/$PROJECT_DIR/deploy/"

# Работа с сертификатами
echo "🔐 Проверка сертификатов для домена $DOMAIN..."
CERT_DIR="deploy/cert"
CERT_FILE="$CERT_DIR/$DOMAIN.crt"
KEY_FILE="$CERT_DIR/$DOMAIN.key"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "⚠️ Сертификаты для $DOMAIN не найдены локально."
    echo "⚙️ Запуск получения сертификатов через Certbot на сервере..."

    # Команды для установки certbot и генерации сертификатов
    CERTBOT_COMMANDS="
    # Установка certbot если не установлен
    if ! command -v certbot &> /dev/null; then
        echo '📦 Установка Certbot...'
        apt-get update && apt-get install -y certbot
    fi

    # Остановка nginx (если запущен), чтобы освободить 80 порт для certbot
    echo '🛑 Остановка Nginx для валидации домена...'
    # Пробуем остановить системный nginx (если есть) и докер-контейнер
    systemctl stop nginx 2>/dev/null || true
    docker stop deploy-nginx-1 2>/dev/null || true

    # Получение сертификата
    echo \"🔒 Получение сертификата Lets Encrypt...\"
    certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN --keep-until-expiring

    # Проверка успеха
    if [ -f \"/etc/letsencrypt/live/$DOMAIN/fullchain.pem\" ]; then
        echo '✅ Сертификат успешно получен!'
        # Копируем сертификаты в папку deploy/cert на сервере для удобства скачивания
        mkdir -p ~/$PROJECT_DIR/deploy/cert
        cp -L /etc/letsencrypt/live/$DOMAIN/fullchain.pem ~/$PROJECT_DIR/deploy/cert/fullchain.pem
        cp -L /etc/letsencrypt/live/$DOMAIN/privkey.pem ~/$PROJECT_DIR/deploy/cert/privkey.pem
    else
        echo '⚠️ Ошибка получения сертификата Lets Encrypt (возможно, проблема с DNS).'
        echo '⚙️ Генерация самоподписанного сертификата...'
        mkdir -p ~/$PROJECT_DIR/deploy/cert
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ~/$PROJECT_DIR/deploy/cert/privkey.pem \
            -out ~/$PROJECT_DIR/deploy/cert/fullchain.pem \
            -subj \"/C=RU/ST=Moscow/L=Moscow/O=Invest/CN=$DOMAIN\"
        echo '✅ Самоподписанный сертификат создан.'
    fi
    "
    
    $SSH_CMD "$TARGET" "$CERTBOT_COMMANDS"
    
    # Проверяем успешность выполнения блока команд (включая fallback)
    if [ $? -eq 0 ]; then
        echo "📥 Скачивание сертификатов на локальную машину..."
        mkdir -p "$CERT_DIR"
        $SCP_CMD "$TARGET:~/$PROJECT_DIR/deploy/cert/fullchain.pem" "$CERT_FILE"
        $SCP_CMD "$TARGET:~/$PROJECT_DIR/deploy/cert/privkey.pem" "$KEY_FILE"
        echo "✅ Сертификаты сохранены в $CERT_DIR"
    else
        echo "❌ Ошибка при удаленной генерации сертификатов."
        exit 1
    fi
else
    echo "✅ Испольуются существующие сертификаты из $CERT_DIR"
fi

echo "📤 Отправка сертификатов на сервер..."
$SSH_CMD "$TARGET" "mkdir -p ~/$PROJECT_DIR/deploy/cert"
# Если сертификаты были только что сгенерированы на сервере, они там уже есть, но этот шаг гарантирует синхронизацию
$SCP_CMD "$CERT_FILE" "$TARGET:~/$PROJECT_DIR/deploy/cert/fullchain.pem"
$SCP_CMD "$KEY_FILE" "$TARGET:~/$PROJECT_DIR/deploy/cert/privkey.pem"

# 3. Сборка (Docker) и запуск на сервере
echo "🏗 Сборка Docker образа и запуск на сервере..."
# Экранируем $ в переменных, которые должны раскрываться на удаленном сервере, а не локально
REMOTE_COMMANDS="
set -e
cd ~/$PROJECT_DIR
rm -rf src_deploy
mkdir -p src_deploy
tar -xzf deploy/$TAR_NAME -C src_deploy
rm deploy/$TAR_NAME
cd src_deploy
if [ -f \"deploy/nginx.conf\" ]; then
  sed -i \"s/server_name .*/server_name $DOMAIN www.$DOMAIN localhost;/g\" deploy/nginx.conf
fi
cp deploy/docker-compose.yml ../deploy/docker-compose.yml
cp deploy/nginx.conf ../deploy/nginx.conf
cp deploy/frontend.Dockerfile ../deploy/frontend.Dockerfile
cp deploy/nginx.Dockerfile ../deploy/nginx.Dockerfile
cd ../deploy
export NEXT_PUBLIC_WS_URL=\"wss://$DOMAIN/api/ws\"
export NEXT_PUBLIC_IS_DEV=\"$IS_DEV\"
docker compose up -d --no-deps --build --force-recreate frontend nginx
sleep 5
docker ps
"

$SSH_CMD "$TARGET" "$REMOTE_COMMANDS"

# Очистка локального архива
rm "$TAR_NAME"
echo "✅ Деплой успешно завершен!"
