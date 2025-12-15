# Структура Python ML Сервиса

## Архитектура

Архитектура внутреннего сервиса:

```
python-service/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Точка входа FastAPI приложения
│   │
│   ├── api/                    # API Layer
│   │   ├── __init__.py
│   │   ├── router.py          # Главный роутер
│   │   ├── dto.py             # Data Transfer Objects
│   │   └── endpoints/
│   │       ├── generate.py    # Endpoints для генерации
│   │       └── embeddings.py  # Endpoints для эмбеддингов (будущее)
│   │
│   ├── config/                 # Configuration Layer
│   │   ├── __init__.py
│   │   ├── settings.py        # Настройки из env переменных
│   │   └── model_config.py     # Конфигурация модели из YAML
│   │
│   ├── model/                  # Model Management Layer
│   │   ├── __init__.py
│   │   └── manager.py          # Управление моделями и токенизаторами
│   │
│   ├── service/                # Service Layer (Inference Engine)
│   │   ├── __init__.py
│   │   └── inference.py        # Потоковая генерация и inference
│   │
│   ├── integration/            # Integration Layer
│   │   ├── __init__.py
│   │   └── backend_client.py  # Клиент для Go сервиса
│   │
│   └── monitoring/             # Monitoring Layer
│       ├── __init__.py
│       ├── logging.py          # Настройка логирования
│       └── metrics.py          # Метрики и мониторинг
│
├── config/
│   └── model_config.yaml      # Конфигурация модели
│
├── requirements.txt           # Python зависимости
├── Dockerfile                 # Docker образ
├── env.example               # Пример env файла
└── README.md                 # Документация
```

## Компоненты

### 1. API Layer (`app/api/`)
- **router.py**: Главный роутер, объединяющий все endpoints
- **dto.py**: Pydantic модели для запросов и ответов
- **endpoints/generate.py**: 
  - `POST /api/v1/generate/` - синхронная генерация
  - `POST /api/v1/generate/stream` - потоковая генерация (SSE)
  - `WebSocket /api/v1/generate/ws` - WebSocket генерация
- **endpoints/embeddings.py**: Endpoints для эмбеддингов (заглушка)

### 2. Configuration Layer (`app/config/`)
- **settings.py**: Настройки из переменных окружения (Pydantic Settings)
- **model_config.py**: Загрузка конфигурации модели из YAML

### 3. Model Management Layer (`app/model/`)
- **manager.py**: 
  - Singleton для управления моделью
  - Lazy loading моделей
  - Поддержка quantization (4bit, 8bit)
  - Управление токенизаторами
  - Кэширование моделей

### 4. Service Layer (`app/service/`)
- **inference.py**:
  - `StreamingGenerator`: Потоковая генерация токенов
  - `InferenceService`: Сервис для обработки запросов
  - Форматирование промптов с историей
  - Управление контекстом диалога

### 5. Integration Layer (`app/integration/`)
- **backend_client.py**: Клиент для коммуникации с Go сервисом (заглушка для будущего использования)

### 6. Monitoring Layer (`app/monitoring/`)
- **logging.py**: Настройка структурированного логирования
- **metrics.py**: Сбор метрик (готово для интеграции с Prometheus)

## Принципы проектирования

1. **Разделение ответственности**: Каждый слой имеет четкую ответственность
2. **Dependency Injection**: Использование singleton для ModelManager
3. **Async/Await**: Асинхронная обработка для потоковой генерации
4. **Конфигурация**: Гибкая конфигурация через env и YAML
5. **Обработка ошибок**: Логирование и обработка исключений на всех уровнях

## Согласованность с бэкендом

Архитектура Python сервиса соответствует структуре Go бэкенда:
- **API Layer** ↔ **Handler Layer** (Go)
- **Service Layer** ↔ **Service Layer** (Go)
- **Model Layer** ↔ **Repository Layer** (Go) - аналогичная абстракция
- **Config Layer** ↔ **Config Layer** (Go)
- **Monitoring Layer** ↔ **Middleware** (Go)

