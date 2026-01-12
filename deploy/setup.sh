#!/bin/bash

# setup.sh - Настройка сервера Ubuntu 24.04 для деплоя
# Использование: ./setup.sh [user@host] [password]
# Если password не передан, используется стандартная ssh авторизация (ключи)

TARGET=$1
PASSWORD=$2

# Интерактивный запрос параметров, если они не заданы
if [ -z "$TARGET" ]; then
    read -p "Введите адрес сервера (user@host): " TARGET
fi

if [ -z "$TARGET" ]; then
  echo "❌ Ошибка: Адрес сервера обязателен!"
  echo "Использование: $0 <user@host> [password]"
  exit 1
fi

if [ -z "$PASSWORD" ]; then
    echo "Введите пароль (оставьте пустым для SSH ключей):"
    read -s PASSWORD
fi

echo "🚀 Начинаем настройку сервера $TARGET..."

# Команды для выполнения на удаленном сервере
REMOTE_SCRIPT="
set -e

echo '📦 Обновление пакетов...'
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

echo '🐳 Установка Docker...'
# Add Docker's official GPG key:
sudo install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
fi

# Add the repository to Apt sources:
echo \
  \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  \$(. /etc/os-release && echo \"\$VERSION_CODENAME\") stable\" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo '✅ Docker установлен.'
docker --version
docker compose version

echo '🔧 Настройка прав доступа...'
# Если пользователь не root, добавляем его в группу docker
if [ \"\$USER\" != \"root\" ]; then
    sudo usermod -aG docker \$USER
    echo \"⚠️  Пользователь \$USER добавлен в группу docker. Вам может потребоваться перезайти в систему.\"
fi
"

# Выполнение скрипта
if [ -n "$PASSWORD" ]; then
  if ! command -v sshpass &> /dev/null; then
      echo "❌ sshpass не установлен. Установите его (brew install sshpass / apt install sshpass) или используйте SSH ключи."
      exit 1
  fi
  sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$TARGET" "$REMOTE_SCRIPT"
else
  ssh -o StrictHostKeyChecking=no "$TARGET" "$REMOTE_SCRIPT"
fi

echo "🎉 Настройка сервера завершена!"
