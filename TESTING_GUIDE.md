# Руководство по тестированию Backend + ML сервиса

## Подготовка окружения

### 1. Настройка базы данных PostgreSQL

Убедитесь, что PostgreSQL запущен и создана база данных:

```sql
-- Подключитесь к PostgreSQL и выполните:
CREATE DATABASE chat_db;
CREATE USER chat_app_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_app_user;
```

### 2. Создание .env файлов

#### Backend (.env в папке `backend/`)

Создайте файл `backend/.env` на основе `backend/.env.example`:

```env
# Server Configuration
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
SERVER_READ_TIMEOUT=15s
SERVER_WRITE_TIMEOUT=15s
SERVER_IDLE_TIMEOUT=60s
ENVIRONMENT=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=chat_app_user
DB_PASSWORD=your_password_here
DB_NAME=chat_db
DB_SSLMODE=disable
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=5m

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=168h

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# LLM Service Configuration
LLM_SERVICE_URL=http://localhost:5000
LLM_SERVICE_TIMEOUT=5m
```

#### Python ML Service (.env в папке `python-service/`)

Создайте файл `python-service/.env` на основе `python-service/env.example`:

```env
# Server Configuration
HOST=0.0.0.0
PORT=5000
DEBUG=false

# Model Configuration
# Model Configuration
# For 3B: Qwen/Qwen2.5-3B-Instruct (quantization: none)
# For 7B: Qwen/Qwen2.5-7B-Instruct (quantization: 4bit)
MODEL_NAME=Qwen/Qwen2.5-3B-Instruct
HUGGINGFACE_TOKEN=your_token_here
DEVICE=cuda
QUANTIZATION=none
DTYPE=bfloat16

# Если у вас нет GPU, используйте:
# DEVICE=cpu
# QUANTIZATION=none
# DTYPE=float32

# Generation Parameters
MAX_NEW_TOKENS=1024
TEMPERATURE=0.7
TOP_P=0.9
REPETITION_PENALTY=1.1
CONTEXT_WINDOW=4096

# Streaming Configuration
CHUNK_SIZE=10
DELAY_MS=50
BUFFER_SIZE=100

# Backend Integration
BACKEND_URL=http://localhost:8080

# Model Config File
MODEL_CONFIG_PATH=config/model_config.yaml
```

**Важно для CPU:**
Если у вас нет GPU, измените в `.env`:
- `DEVICE=cpu`
- `QUANTIZATION=none`
- `DTYPE=float32`

## Запуск сервисов

### Шаг 1: Запуск PostgreSQL

Убедитесь, что PostgreSQL запущен:
```bash
# Windows (если установлен как сервис)
# PostgreSQL должен запускаться автоматически

# Проверка подключения
psql -U chat_app_user -d chat_db
```

### Шаг 2: Запуск Python ML Service

Откройте терминал в папке `python-service/`:

```bash
# Установка зависимостей (если еще не установлены)
pip install -r requirements.txt

# Запуск сервиса
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

**Проверка:** Откройте в браузере `http://localhost:5000/health`
Должен вернуться JSON с информацией о состоянии сервиса.

**Примечание:** При первом запуске модель будет загружаться, это может занять несколько минут.

### Шаг 3: Запуск Go Backend

Откройте новый терминал в папке `backend/`:

```bash
# Установка зависимостей (если еще не установлены)
go mod download

# Запуск сервера
go run cmd/server/main.go
```

**Проверка:** Откройте в браузере `http://localhost:8080/health`
Должен вернуться JSON: `{"status":"healthy","service":"chat-backend"}`

## Тестирование через Postman

### 1. Регистрация пользователя

**Запрос:**
- **Метод:** `POST`
- **URL:** `http://localhost:8080/api/v1/auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123!"
  }
  ```

**Ожидаемый ответ:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "username": "testuser",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "access_token": "jwt-token-here",
  "refresh_token": "refresh-token-here"
}
```

**Сохраните `access_token` для следующих запросов!**

### 2. Вход (альтернатива регистрации)

**Запрос:**
- **Метод:** `POST`
- **URL:** `http://localhost:8080/api/v1/auth/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "test@example.com",
    "password": "TestPassword123!"
  }
  ```

### 3. Создание чат-сессии

**Запрос:**
- **Метод:** `POST`
- **URL:** `http://localhost:8080/api/v1/chats`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```
- **Body (raw JSON):**
  ```json
  {
    "title": "Test Chat",
    "model_used": "qwen2.5-3b"
  }
  ```

**Ожидаемый ответ:**
```json
{
  "id": "session-uuid-here",
  "title": "Test Chat",
  "model_used": "qwen2.5-3b",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "is_archived": false
}
```

**Сохраните `id` сессии для следующего шага!**

### 4. Тестирование генерации ответа (потоковая)

**Запрос:**
- **Метод:** `GET`
- **URL:** `http://localhost:8080/api/v1/stream/chat/{SESSION_ID}?message=Привет! Расскажи о себе.`
- **Headers:**
  ```
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Accept: text/event-stream
  ```

**Важно:** В Postman для SSE запросов:
1. Выберите метод `GET`
2. Вставьте URL с параметром `message` в query string
3. Добавьте заголовок `Authorization: Bearer YOUR_ACCESS_TOKEN`
4. Нажмите "Send"
5. Ответ будет приходить потоком в формате Server-Sent Events

**Пример URL:**
```
http://localhost:8080/api/v1/stream/chat/123e4567-e89b-12d3-a456-426614174000?message=Привет!%20Расскажи%20о%20себе.
```

**Ожидаемый ответ (newline-delimited JSON формат):**
```
{"type":"token","content":"Привет","tokens":1}
{"type":"token","content":"!","tokens":2}
{"type":"token","content":" Я","tokens":3}
...
{"type":"complete","content":"Полный ответ здесь","tokens":150}
```

**Примечание:** Postman может не отображать поток правильно. Для тестирования лучше использовать curl или специальные инструменты для SSE/streaming.

### 5. Альтернатива: Прямой запрос к Python ML сервису (для тестирования)

Если хотите протестировать ML сервис напрямую (минуя Go backend):

**Запрос:**
- **Метод:** `POST`
- **URL:** `http://localhost:5000/api/v1/generate/`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "prompt": "Привет! Расскажи о себе.",
    "history": []
  }
  ```

**Ожидаемый ответ:**
```json
{
  "response": "Привет! Я - AI ассистент...",
  "tokens": 150
}
```

### 6. Потоковая генерация напрямую от ML сервиса

**Запрос:**
- **Метод:** `POST`
- **URL:** `http://localhost:5000/api/v1/generate/stream`
- **Headers:**
  ```
  Content-Type: application/json
  Accept: text/event-stream
  ```
- **Body (raw JSON):**
  ```json
  {
    "prompt": "Привет! Расскажи о себе.",
    "history": []
  }
  ```

## Проверка работоспособности

### Проверка Go Backend:
```bash
curl http://localhost:8080/health
```

### Проверка Python ML Service:
```bash
curl http://localhost:5000/health
```

### Проверка подключения Backend к ML Service:

В логах Go backend при запуске не должно быть ошибок подключения к `http://localhost:5000`.

## Устранение проблем

### Проблема: "Connection refused" при обращении к ML сервису

**Решение:**
1. Убедитесь, что Python сервис запущен на порту 5000
2. Проверьте `LLM_SERVICE_URL` в `.env` файле backend
3. Проверьте, что порт 5000 не занят другим процессом

### Проблема: Модель не загружается

**Решение:**
1. Проверьте `HUGGINGFACE_TOKEN` в `.env` (если модель требует авторизации)
2. Убедитесь, что есть доступ к интернету для загрузки модели
3. Для CPU: измените `DEVICE=cpu`, `QUANTIZATION=none`

### Проблема: "Database connection failed"

**Решение:**
1. Убедитесь, что PostgreSQL запущен
2. Проверьте параметры подключения в `.env`
3. Проверьте, что база данных и пользователь созданы

### Проблема: "Unauthorized" при запросах

**Решение:**
1. Убедитесь, что используете правильный `access_token`
2. Проверьте формат заголовка: `Authorization: Bearer YOUR_TOKEN`
3. Токен может истечь (15 минут по умолчанию), выполните повторный login

## Примеры запросов для Postman Collection

Создайте коллекцию в Postman со следующими запросами:

1. **Register User** - `POST /api/v1/auth/register`
2. **Login** - `POST /api/v1/auth/login`
3. **Create Chat Session** - `POST /api/v1/chats`
4. **Stream Chat** - `GET /api/v1/stream/chat/{session_id}?message=...`
5. **Get Chat Sessions** - `GET /api/v1/chats`
6. **Get Chat with Messages** - `GET /api/v1/chats/{id}?include_messages=true`

## Следующие шаги

После успешного тестирования:
1. Проверьте сохранение истории сообщений в БД
2. Протестируйте несколько последовательных сообщений в одной сессии
3. Проверьте работу с разными моделями (если настроено)

