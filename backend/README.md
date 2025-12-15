# LLM Chat Bot Backend

Backend сервис для чат-бота с LLM, написанный на Go.

## Структура проекта

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # Точка входа приложения
├── internal/
│   ├── config/                  # Конфигурация
│   ├── model/                   # Модели данных
│   ├── repository/              # Репозитории (доступ к данным)
│   ├── service/                 # Бизнес-логика
│   ├── handler/                 # HTTP handlers
│   ├── middleware/              # Middleware
│   ├── database/                # Подключение к БД
│   └── dto/                     # Data Transfer Objects
├── pkg/
│   ├── jwt/                     # JWT утилиты
│   └── utils/                   # Общие утилиты
├── scripts/
│   └── init_db.sql              # SQL скрипт для инициализации БД
├── go.mod
├── go.sum
├── Dockerfile
└── .env.example
```

## Требования

- Go 1.21 или выше
- PostgreSQL 15 или выше
- Redis (опционально, для будущего использования)

## Установка

1. Клонируйте репозиторий
2. Перейдите в директорию backend:
   ```bash
   cd backend
   ```

3. Установите зависимости:
   ```bash
   go mod download
   ```

4. Настройте базу данных PostgreSQL:

   **Вариант 1: Автоматическое создание (рекомендуется)**
   
   Приложение автоматически создаст базу данных `chat_db`, если она не существует. 
   Однако пользователь `chat_app_user` должен быть создан заранее.
   
   Создайте пользователя в PostgreSQL:
   ```sql
   -- Подключитесь к PostgreSQL как суперпользователь (обычно postgres)
   psql -U postgres
   
   -- Создайте пользователя
   CREATE USER chat_app_user WITH PASSWORD 'your_password_here';
   ```
   
   **Вариант 2: Полная ручная инициализация**
   
   Выполните SQL скрипт:
   ```bash
   psql -U postgres -f scripts/init_db.sql
   ```
   
   Или вручную:
   ```sql
   CREATE USER chat_app_user WITH PASSWORD 'your_password_here';
   CREATE DATABASE chat_db OWNER chat_app_user;
   GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_app_user;
   ```

5. Скопируйте `.env.example` в `.env` и настройте переменные окружения:
   ```bash
   cp env.example .env
   ```
   
   Обязательно укажите:
   - `DB_PASSWORD` - пароль для пользователя `chat_app_user`
   - `JWT_SECRET` - секретный ключ для JWT (для production используйте случайную строку)

6. Запустите сервер:
   ```bash
   go run cmd/server/main.go
   ```
   
   При первом запуске приложение:
   - Создаст базу данных, если её нет
   - Выполнит миграции (создаст таблицы)

## Конфигурация

Все настройки выполняются через переменные окружения в файле `.env`. Основные параметры:

- `SERVER_PORT` - порт сервера (по умолчанию 8080)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - настройки БД
- `JWT_SECRET` - секретный ключ для JWT токенов
- `LLM_SERVICE_URL` - URL Python LLM сервиса

## API Endpoints

### Аутентификация
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `POST /api/v1/auth/refresh` - Обновление токена
- `POST /api/v1/auth/logout` - Выход

### Пользователи
- `GET /api/v1/users/me` - Получить профиль
- `PUT /api/v1/users/me` - Обновить профиль

### Чаты
- `GET /api/v1/chats` - Список чат-сессий
- `POST /api/v1/chats` - Создать чат-сессию
- `GET /api/v1/chats/:id` - Получить чат-сессию
- `PUT /api/v1/chats/:id` - Обновить чат-сессию
- `DELETE /api/v1/chats/:id` - Архивировать чат-сессию

### Стриминг
- `GET /api/v1/stream/chat/:session_id?message=...` - SSE поток для получения ответов

### Системные
- `GET /health` - Health check

## Разработка

Проект следует принципам Clean Architecture:
- **Handlers** - обработка HTTP запросов
- **Services** - бизнес-логика
- **Repositories** - доступ к данным
- **Models** - модели данных

## Docker

Для сборки Docker образа:

```bash
docker build -t llmchatbot-backend .
```

Для запуска через Docker Compose см. основной `docker-compose.yml` в корне проекта.

## Тестирование

```bash
go test ./...
```

## Линтинг

```bash
golangci-lint run
```

## Устранение проблем

### Ошибка подключения к базе данных

Если вы видите ошибку `failed SASL auth` или `database does not exist`:

1. Убедитесь, что PostgreSQL запущен
2. Создайте пользователя `chat_app_user`:
   ```sql
   CREATE USER chat_app_user WITH PASSWORD 'your_password';
   ```
3. Убедитесь, что пароль в `.env` совпадает с паролем пользователя
4. Приложение автоматически создаст базу данных при первом запуске

### База данных создается автоматически

Приложение теперь автоматически создает базу данных `chat_db`, если она не существует. 
Однако пользователь PostgreSQL должен быть создан заранее.
