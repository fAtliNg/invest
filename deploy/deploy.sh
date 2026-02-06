#!/bin/bash

# deploy.sh - Основной скрипт деплоя (Orchestrator)
# Использование: ./deploy/deploy.sh [user@host] [-p password]
# Если параметры не переданы, скрипт запросит их интерактивно.

TARGET=""
PASSWORD=""
DOMAIN=""

# Функция для вывода справки
usage() {
    echo "Использование: $0 [user@host] [-p password] [-d domain]"
    echo ""
    echo "Опции:"
    echo "  -p, --password <password>  Пароль для SSH подключения"
    echo "  -d, --domain <domain>      Доменное имя для SSL сертификатов"
    echo "  -h, --help                 Показать эту справку"
    exit 1
}

# Парсинг аргументов
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
    -h|--help)
      usage
      ;;
    *)
      if [ -z "$TARGET" ]; then
        TARGET="$1"
      else
        # Если второй позиционный аргумент передан, считаем его паролем (для совместимости)
        if [ -z "$PASSWORD" ]; then
            PASSWORD="$1"
        fi
      fi
      shift
      ;;
  esac
done

# Интерактивный запрос параметров, если они не заданы
if [ -z "$TARGET" ]; then
    read -p "Введите адрес сервера (user@host): " TARGET
fi

if [ -z "$TARGET" ]; then
    echo "❌ Ошибка: Адрес сервера обязателен!"
    exit 1
fi

# Если пароль не передан, используем SSH-ключи без интерактива

if [ -z "$DOMAIN" ]; then
    read -p "Введите доменное имя (например, example.com): " DOMAIN
fi

if [ -z "$DOMAIN" ]; then
    echo "❌ Ошибка: Домен обязателен!"
    exit 1
fi

PROJECT_DIR="invest"

# Проверка наличия подскриптов
SCRIPT_DIR=$(dirname "$0")
DEPLOY_DB="$SCRIPT_DIR/deploy_db.sh"
DEPLOY_BACKEND="$SCRIPT_DIR/deploy_backend.sh"
DEPLOY_LOGOS="$SCRIPT_DIR/deploy_logos.sh"
DEPLOY_FRONTEND="$SCRIPT_DIR/deploy_frontend.sh"

if [ ! -x "$DEPLOY_DB" ] || [ ! -x "$DEPLOY_BACKEND" ] || [ ! -x "$DEPLOY_LOGOS" ] || [ ! -x "$DEPLOY_FRONTEND" ]; then
    echo "❌ Ошибка: Один или несколько скриптов деплоя не найдены или не исполняемые."
    echo "Ожидаются:"
    echo "  - $DEPLOY_DB"
    echo "  - $DEPLOY_BACKEND"
    echo "  - $DEPLOY_LOGOS"
    echo "  - $DEPLOY_FRONTEND"
    exit 1
fi

echo "🚀 Начинаем полный деплой проекта на $TARGET..."

# 0. Подготовка и отправка .env файла
echo ""
echo "=========================================="
echo "📝 ШАГ 0: Настройка окружения (.env)"
echo "=========================================="

ENV_FILE=""
if [[ "$DOMAIN" == "profit-case.ru" ]]; then
    ENV_FILE="deploy/env.prod"
    echo "✅ Выбран PROD конфиг: $ENV_FILE"
elif [[ "$DOMAIN" == "profit-case-dev.ru" ]]; then
    ENV_FILE="deploy/env.dev"
    echo "✅ Выбран DEV конфиг: $ENV_FILE"
else
    echo "⚠️ Неизвестный домен: $DOMAIN. Попытка найти deploy/env.$DOMAIN"
    if [ -f "deploy/env.$DOMAIN" ]; then
        ENV_FILE="deploy/env.$DOMAIN"
    elif [ -f "deploy/.env" ]; then
        ENV_FILE="deploy/.env"
        echo "⚠️ Используется стандартный deploy/.env"
    else
        echo "❌ Не найден подходящий .env файл. Создайте deploy/env.prod или deploy/env.dev"
        exit 1
    fi
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Ошибка: Файл конфигурации $ENV_FILE не найден!"
    exit 1
fi

# Создаем директорию на сервере, если её нет
echo "📁 Создание директории $PROJECT_DIR/deploy..."
if [ -n "$PASSWORD" ]; then
    if ! command -v sshpass &> /dev/null; then
        echo "❌ sshpass не установлен."
        exit 1
    fi
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$TARGET" "mkdir -p ~/$PROJECT_DIR/deploy"
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$ENV_FILE" "$TARGET:~/$PROJECT_DIR/deploy/.env"
else
    ssh -o StrictHostKeyChecking=no "$TARGET" "mkdir -p ~/$PROJECT_DIR/deploy"
    scp -o StrictHostKeyChecking=no "$ENV_FILE" "$TARGET:~/$PROJECT_DIR/deploy/.env"
fi

echo "✅ Файл окружения отправлен на сервер."

# 1. Деплой базы данных
echo ""
echo "=========================================="
echo "🗄️  ШАГ 1: Деплой базы данных и миграций"
echo "=========================================="
"$DEPLOY_DB" "$TARGET" -p "$PASSWORD"
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при деплое базы данных. Прерывание."
    exit 1
fi

# 2. Деплой бэкенда
echo ""
echo "=========================================="
echo "⚙️  ШАГ 2: Деплой бэкенда (API)"
echo "=========================================="
"$DEPLOY_BACKEND" "$TARGET" -p "$PASSWORD"
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при деплое бэкенда. Прерывание."
    exit 1
fi

# 3. Деплой сервиса логотипов
echo ""
echo "=========================================="
echo "🖼️  ШАГ 3: Деплой Logo Service"
echo "=========================================="
"$DEPLOY_LOGOS" "$TARGET" -p "$PASSWORD"
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при деплое сервиса логотипов. Прерывание."
    exit 1
fi

# 4. Деплой фронтенда
echo ""
echo "=========================================="
echo "🌐 ШАГ 4: Деплой фронтенда (Nginx + Next.js)"
echo "=========================================="
"$DEPLOY_FRONTEND" "$TARGET" -p "$PASSWORD" -d "$DOMAIN"
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при деплое фронтенда. Прерывание."
    exit 1
fi

echo ""
echo "=========================================="
echo "✨ Полный деплой успешно завершен! ✨"
echo "=========================================="
