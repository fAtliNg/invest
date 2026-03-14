#!/bin/bash

# deploy_news.sh - Деплой news-service
# Использование: ./deploy/deploy_news.sh [user@host] [-p password]

TARGET=""
PASSWORD=""
PROJECT_DIR="invest"
TAR_NAME="news_src.tar.gz"
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

# Проверка, что мы в корне проекта
if [ ! -f "$LOCAL_DIR/package.json" ]; then
    echo "❌ Ошибка: Запускайте скрипт из корня проекта!"
    exit 1
fi

# Настройка SSH подключения
echo "🔑 Установка соединения с $TARGET..."

SOCKET="/tmp/ssh_deploy_news_$$"

start_ssh_master() {
    if [ -n "$PASSWORD" ]; then
        if ! command -v sshpass &> /dev/null; then
            echo "❌ sshpass не установлен."
            exit 1
        fi
        export SSHPASS="$PASSWORD"
        sshpass -e ssh -o ControlPersist=600 -M -S "$SOCKET" -fN -o StrictHostKeyChecking=no "$TARGET"
    else
        echo "👉 Если используется пароль, введите его ОДИН раз."
        ssh -o ControlPersist=600 -M -S "$SOCKET" -fN -o StrictHostKeyChecking=no "$TARGET"
    fi
}

start_ssh_master
if [ $? -ne 0 ]; then
    echo "❌ Не удалось установить соединение."
    exit 1
fi

trap "ssh -S \"$SOCKET\" -O exit \"$TARGET\" 2>/dev/null" EXIT

SSH_CMD="ssh -S $SOCKET"
SCP_CMD="scp -o ControlPath=$SOCKET"

echo "🚀 Начинаем деплой news-service на $TARGET..."

# 1. Упаковка исходного кода
echo "📦 Упаковка исходного кода..."
if [ -d "news-service" ]; then
    COPYFILE_DISABLE=1 tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.DS_Store' --exclude='._*' --exclude='__MACOSX' -czf "$TAR_NAME" -C news-service .
else
    echo "❌ Ошибка: Папка news-service не найдена!"
    exit 1
fi

# 2. Отправка файлов на сервер
echo "📤 Отправка файлов на сервер..."
$SSH_CMD "$TARGET" "mkdir -p ~/$PROJECT_DIR/news-service ~/$PROJECT_DIR/deploy"
$SCP_CMD "$TAR_NAME" "$TARGET:~/$PROJECT_DIR/news-service/"

# Отправляем Dockerfile и docker-compose.yml
$SCP_CMD "deploy/news.Dockerfile" "$TARGET:~/$PROJECT_DIR/deploy/news.Dockerfile"

if [ -f "deploy/docker-compose.yml" ]; then
    $SCP_CMD "deploy/docker-compose.yml" "$TARGET:~/$PROJECT_DIR/deploy/docker-compose.yml"
fi

# 3. Сборка и перезапуск
echo "🏗 Сборка и перезапуск на сервере..."
REMOTE_COMMANDS="
set -e
cd ~/$PROJECT_DIR/news-service

echo '📥 Распаковка исходного кода...'
tar -xzf $TAR_NAME
rm $TAR_NAME

cd ../deploy

echo '🔄 Пересборка и перезапуск контейнера news-service...'
docker compose up -d --build --force-recreate news-service

echo '⏳ Проверка статуса...'
sleep 5
if docker ps | grep -q \"deploy-news-service-1\"; then
    echo '✅ Контейнер news-service запущен!'
    docker logs --tail 20 deploy-news-service-1
else
    echo '❌ Ошибка: Контейнер news-service не запущен!'
    docker logs deploy-news-service-1
    exit 1
fi
"

$SSH_CMD "$TARGET" "$REMOTE_COMMANDS"

# Очистка локального архива
rm "$TAR_NAME"
echo "🧹 Очистка..."
echo "✅ Деплой news-service завершен!"
