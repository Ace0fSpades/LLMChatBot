# Быстрый старт для тестирования

## 1. Создайте .env файлы

### `backend/.env`
```env
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=chat_app_user
DB_PASSWORD=your_password_here
DB_NAME=chat_db
DB_SSLMODE=disable
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
LLM_SERVICE_URL=http://localhost:5000
```

### `python-service/.env`
```env
HOST=0.0.0.0
PORT=5000
MODEL_NAME=Qwen/Qwen2.5-3B-Instruct
DEVICE=cpu
QUANTIZATION=none
DTYPE=float32
MAX_NEW_TOKENS=512
TEMPERATURE=0.6
```

**Для CPU используйте:** `DEVICE=cpu`, `QUANTIZATION=none`, `DTYPE=float32`

## 2. Запустите сервисы

### Терминал 1 - Python ML Service
```bash
cd python-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

### Терминал 2 - Go Backend
```bash
cd backend
go run cmd/server/main.go
```

## 3. Тестирование в Postman

### Шаг 1: Регистрация
```
POST http://localhost:8080/api/v1/auth/register
Body:
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "TestPassword123!"
}
```

### Шаг 2: Создание чата
```
POST http://localhost:8080/api/v1/chats
Headers: Authorization: Bearer YOUR_TOKEN
Body:
{
  "title": "Test Chat"
}
```

### Шаг 3: Генерация ответа
```
GET http://localhost:8080/api/v1/stream/chat/{SESSION_ID}?message=Привет!
Headers: Authorization: Bearer YOUR_TOKEN
Accept: text/event-stream
```

## 4. Прямой тест ML сервиса

```
POST http://localhost:5000/api/v1/generate/
Body:
{
  "prompt": "Привет! Расскажи о себе.",
  "history": []
}
```

Подробная инструкция в `TESTING_GUIDE.md`

