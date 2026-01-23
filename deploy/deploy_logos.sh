#!/bin/bash

# deploy_logos.sh - Деплой микросервиса логотипов
# Использование: ./deploy/deploy_logos.sh [user@host] [-p password]

TARGET=""
PASSWORD=""
PROJECT_DIR="invest"
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
    echo "Пример: ./deploy/deploy_logos.sh root@1.2.3.4"
    exit 1
fi

# Настройка SSH подключения
echo "🔑 Установка соединения с $TARGET..."

SOCKET="/tmp/ssh_deploy_logos_$$"

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

start_ssh_master
if [ $? -ne 0 ]; then
    echo "❌ Не удалось установить соединение."
    exit 1
fi

trap "ssh -S \"$SOCKET\" -O exit \"$TARGET\" 2>/dev/null" EXIT

SSH_CMD="ssh -S $SOCKET"
SCP_CMD="scp -o ControlPath=$SOCKET"

echo "🚀 Начинаем деплой Logo Service на $TARGET..."

# 0. Синхронизация папки logos (если существует локально)
if [ -d "$LOCAL_DIR/logos" ]; then
    echo "� Архивирование логотипов для быстрой отправки..."
    TAR_NAME="logos_deploy.tar.gz"
    
    # Создаем архив локально (используем COPYFILE_DISABLE=1 для macOS, чтобы не было ._ файлов)
    # -C переходит в директорию перед архивацией, чтобы в архиве была папка logos
    COPYFILE_DISABLE=1 tar -czf "$LOCAL_DIR/$TAR_NAME" -C "$LOCAL_DIR" logos
    
    echo "📤 Отправка архива логотипов..."
    # Создаем папку проекта на сервере, если её нет
    $SSH_CMD "$TARGET" "mkdir -p ~/$PROJECT_DIR"
    
    # Отправляем архив
    $SCP_CMD "$LOCAL_DIR/$TAR_NAME" "$TARGET:~/$PROJECT_DIR/"
    
    echo "vk Распаковка логотипов на сервере..."
    # Распаковываем и удаляем архив на сервере
    $SSH_CMD "$TARGET" "cd ~/$PROJECT_DIR && tar -xzf $TAR_NAME && rm $TAR_NAME"
    
    # Удаляем локальный архив
    rm "$LOCAL_DIR/$TAR_NAME"
    
    echo "✅ Логотипы синхронизированы."
else
    echo "⚠️ Папка logos не найдена локально. Пропускаем синхронизацию."
fi

# 1. Отправка конфигурационных файлов
echo "📤 Отправка конфигурации..."
$SSH_CMD "$TARGET" "mkdir -p ~/$PROJECT_DIR/deploy"
$SCP_CMD "deploy/logo.Dockerfile" "$TARGET:~/$PROJECT_DIR/deploy/"
$SCP_CMD "deploy/logo-nginx.conf" "$TARGET:~/$PROJECT_DIR/deploy/"

# Отправляем docker-compose.yml, чтобы убедиться, что он свежий
if [ -f "deploy/docker-compose.yml" ]; then
    $SCP_CMD "deploy/docker-compose.yml" "$TARGET:~/$PROJECT_DIR/deploy/docker-compose.yml"
fi

# 2. Сборка и перезапуск сервиса
echo "🏗 Сборка и перезапуск сервиса..."
REMOTE_COMMANDS="
set -e
cd ~/$PROJECT_DIR/deploy

echo '🏗 Сборка контейнера logo-service...'
docker compose up -d --build --force-recreate logo-service

echo '✅ Logo Service успешно обновлен!'
"

$SSH_CMD "$TARGET" "$REMOTE_COMMANDS"

echo "✅ Деплой Logo Service завершен!"
