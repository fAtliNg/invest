#!/bin/bash

# deploy_db.sh - Деплой базы данных и миграций Liquibase
# Использование: ./deploy/deploy_db.sh [user@host] [-p password]

TARGET=""
PASSWORD=""
PROJECT_DIR="invest"
TAR_NAME="db_src.tar.gz"
LOCAL_DIR=$(pwd)

while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--password)
      PASSWORD="$2"
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
  echo "Usage: $0 <user@host> [-p password]"
  exit 1
fi

HOST=$(echo $TARGET | cut -d@ -f2)

# Проверка, что мы в корне проекта
if [ ! -f "$LOCAL_DIR/package.json" ]; then
    echo "❌ Ошибка: Запускайте скрипт из корня проекта!"
    echo "Пример: ./deploy/deploy_db.sh root@1.2.3.4"
    exit 1
fi

# Настройка SSH подключения (Интерактивный режим / Multiplexing)
echo "🔑 Установка соединения с $TARGET..."

SOCKET="/tmp/ssh_deploy_db_$$"

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

echo "🚀 Начинаем деплой БД на $TARGET..."

# 1. Упаковка файлов миграции
echo "📦 Упаковка файлов Liquibase..."
# Use COPYFILE_DISABLE=1 to avoid macOS metadata (._ files)
if [ -d "backend/liquibase" ]; then
    COPYFILE_DISABLE=1 tar --exclude='._*' --exclude='__MACOSX' -czf "$TAR_NAME" -C backend liquibase
else
    echo "❌ Ошибка: Папка backend/liquibase не найдена!"
    exit 1
fi

# 2. Отправка файлов на сервер
echo "📤 Отправка файлов на сервер..."
$SSH_CMD "$TARGET" "mkdir -p ~/$PROJECT_DIR/deploy ~/$PROJECT_DIR/backend"
$SCP_CMD "$TAR_NAME" "$TARGET:~/$PROJECT_DIR/backend/"

# Отправляем docker-compose.yml, чтобы быть уверенными в актуальности конфигурации
if [ -f "deploy/docker-compose.yml" ]; then
    $SCP_CMD "deploy/docker-compose.yml" "$TARGET:~/$PROJECT_DIR/deploy/docker-compose.yml"
else
    echo "⚠️ docker-compose.yml не найден в deploy/! Используется существующий на сервере (если есть)."
fi

# 3. Применение миграций на сервере
echo "🏗 Применение миграций..."
REMOTE_COMMANDS="
set -e
cd ~/$PROJECT_DIR/backend

echo '📥 Распаковка Liquibase...'
tar -xzf $TAR_NAME
rm $TAR_NAME

cd ../deploy

echo '🚀 Запуск базы данных...'
docker compose up -d db

echo '⏳ Ожидание готовности БД...'
# Ждем пока база поднимется (healthcheck в docker-compose может помочь, но пауза не повредит)
sleep 10

echo '🔄 Запуск Liquibase миграций...'
docker compose up --exit-code-from liquibase liquibase

echo '✅ Миграции успешно применены!'
"

$SSH_CMD "$TARGET" "$REMOTE_COMMANDS"

# Очистка локального архива
rm "$TAR_NAME"
echo "✅ Деплой БД завершен!"
