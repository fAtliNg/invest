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

if [ -z "$PASSWORD" ] && [ -t 0 ]; then
    echo "Введите пароль (оставьте пустым для SSH ключей):"
    read -s PASSWORD
fi

echo "🚀 Начинаем настройку сервера $TARGET..."

# Команды для выполнения на удаленном сервере
REMOTE_SCRIPT=$(cat <<'EOF'
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
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo '✅ Docker установлен.'
docker --version
docker compose version

echo '💾 Настройка Swap (файла подкачки)...'
# Проверяем, есть ли уже swap
if [ $(free | awk '/^Swap:/ {print $2}') -eq 0 ]; then
    echo 'Creating 4G swap file...'
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    # Добавляем в fstab для сохранения после перезагрузки
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo '✅ Swap файл (4GB) создан и активирован.'
else
    echo '✅ Swap уже существует.'
fi

echo '🔧 Настройка прав доступа...'
# Если пользователь не root, добавляем его в группу docker
if [ "$USER" != "root" ]; then
    sudo usermod -aG docker $USER
    echo "⚠️  Пользователь $USER добавлен в группу docker. Вам может потребоваться перезайти в систему."
fi

echo '🛡️  Установка и настройка безопасности (UFW, Fail2Ban)...'
sudo apt-get install -y ufw fail2ban

# Настройка UFW (Firewall)
echo '🧱 Настройка Firewall (UFW)...'
# Разрешаем SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Блокируем все остальное по умолчанию
sudo ufw default deny incoming
sudo ufw default allow outgoing
# Включаем UFW (без подтверждения)
sudo ufw --force enable
echo '✅ UFW включен.'

# Настройка Fail2Ban
echo '👮 Настройка Fail2Ban...'
# Копируем конфиг по умолчанию
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
# Включаем защиту SSHD
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
echo '✅ Fail2Ban запущен.'

echo '🔐 Усиление безопасности SSH...'
# Создаем бэкап конфига
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Создаем приоритетный конфиг безопасности
echo "Creating /etc/ssh/sshd_config.d/99-security-hardening.conf..."
echo "PasswordAuthentication no" | sudo tee /etc/ssh/sshd_config.d/99-security-hardening.conf
echo "PermitRootLogin no" | sudo tee -a /etc/ssh/sshd_config.d/99-security-hardening.conf

# На всякий случай пройдемся по другим конфигам и отключим явное включение паролей, 
# чтобы не было путаницы, хотя наш 99-й файл должен перекрыть их.
# Но sshd может ругаться на дублирующиеся директивы.
echo "Cleaning up conflicting configurations..."
sudo grep -l "PasswordAuthentication yes" /etc/ssh/sshd_config.d/*.conf 2>/dev/null | while read f; do 
    echo "Fixing $f..."
    sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' "$f"
done

# Если мы под root, то PermitRootLogin no может нас заблокировать, если у нас нет другого юзера.
# Но скрипт setup.sh запускается один раз. 
# ВНИМАНИЕ: Если вы запускаете это под root и не создали другого юзера с ключами, вы потеряете доступ!
# Поэтому добавим проверку: блокируем root только если текущий пользователь НЕ root.
if [ "$USER" == "root" ]; then
    echo "⚠️  Вы запускаете скрипт от root. PermitRootLogin останется 'yes' (или 'prohibit-password'), чтобы вы не потеряли доступ."
    # Удаляем строку про root из нашего хард-конфига
    sudo sed -i '/PermitRootLogin/d' /etc/ssh/sshd_config.d/99-security-hardening.conf
fi

# Перезапускаем SSHD
sudo systemctl restart ssh
echo '✅ SSH настроен (PasswordAuthentication=no).'
EOF
)

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
