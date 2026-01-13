#!/bin/bash

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
        sshpass -e ssh -o ControlPersist=600 -M -S "$SOCKET" -fN -o StrictHostKeyChecking=no "$TARGET"
    else
        echo "👉 Если используется пароль, введите его ОДИН раз."
        ssh -o ControlPersist=600 -M -S "$SOCKET" -fN -o StrictHostKeyChecking=no "$TARGET"
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

# 1. Упаковка исходного кода (без node_modules)
echo "📦 Упаковка исходного кода..."
# Use COPYFILE_DISABLE=1 to avoid macOS metadata (._ files)
COPYFILE_DISABLE=1 tar --exclude='node_modules' --exclude='.git' --exclude='.next' --exclude='dist' --exclude='.DS_Store' --exclude='*.log' --exclude='._*' --exclude='__MACOSX' -czf "$TAR_NAME" .

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
    echo \"🔒 Получение сертификата Let's Encrypt...\"
    certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN --keep-until-expiring

    # Проверка успеха
    if [ -f \"/etc/letsencrypt/live/$DOMAIN/fullchain.pem\" ]; then
        echo '✅ Сертификат успешно получен!'
        # Копируем сертификаты в папку deploy/cert на сервере для удобства скачивания
        mkdir -p ~/$PROJECT_DIR/deploy/cert
        cp -L /etc/letsencrypt/live/$DOMAIN/fullchain.pem ~/$PROJECT_DIR/deploy/cert/fullchain.pem
        cp -L /etc/letsencrypt/live/$DOMAIN/privkey.pem ~/$PROJECT_DIR/deploy/cert/privkey.pem
    else
        echo '❌ Ошибка получения сертификата!'
        exit 1
    fi
    "
    
    $SSH_CMD "$TARGET" "$CERTBOT_COMMANDS"
    
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

# 3. Сборка и запуск на сервере
echo "🏗 Сборка и запуск на сервере..."
# Экранируем $ в переменных, которые должны раскрываться на удаленном сервере, а не локально
REMOTE_COMMANDS="
set -e
cd ~/$PROJECT_DIR/deploy

echo '📥 Распаковка исходного кода...'
rm -rf temp_build
mkdir -p temp_build
tar -xzf $TAR_NAME -C temp_build
rm $TAR_NAME

echo '🏗 Сборка Docker образа ($IMAGE_NAME)...'
cd temp_build
# Проверка наличия nginx.conf
if [ ! -f \"deploy/nginx.conf\" ]; then
    echo \"❌ Ошибка: deploy/nginx.conf не найден в архиве!\"
    ls -R
    exit 1
fi

# Копируем nginx.conf в корень сборки, чтобы он был доступен, даже если папка deploy в .dockerignore
cp deploy/nginx.conf ./nginx.conf.temp

# Обновляем server_name в nginx.conf
sed -i \"s/server_name .*/server_name $DOMAIN www.$DOMAIN localhost;/g\" nginx.conf.temp

# Копируем docker-compose.yml в папку deploy, чтобы запустить сервис
if [ -f deploy/docker-compose.yml ]; then
    cp deploy/docker-compose.yml ../docker-compose.yml
else
    echo \"⚠️ docker-compose.yml не найден в deploy/!\"
fi

# Создаем временный Dockerfile с исправленным путем
sed 's|deploy/nginx.conf|nginx.conf.temp|g' deploy/nginx.Dockerfile > Dockerfile.temp

docker build \
    -f Dockerfile.temp \
    -t $IMAGE_NAME \
    --build-arg NEXT_PUBLIC_WS_URL=\"wss://$DOMAIN/api/ws\" \
    .

echo '🚀 Перезапуск сервиса nginx...'
cd .. # Возвращаемся в папку deploy (где лежит docker-compose.yml)
docker compose up -d --no-deps --no-build --force-recreate nginx

echo '🔍 Проверка статуса...'
sleep 5
if ! docker ps | grep -q \"deploy-nginx-1\"; then
    echo \"⚠️ ОШИБКА: Контейнер nginx не запустился!\"
    echo \"📋 Логи контейнера:\"
    docker logs deploy-nginx-1
    exit 1
fi

echo '🧹 Очистка...'
rm -rf temp_build
"

$SSH_CMD "$TARGET" "$REMOTE_COMMANDS"

# Очистка локального архива
rm "$TAR_NAME"
echo "✅ Деплой успешно завершен!"
