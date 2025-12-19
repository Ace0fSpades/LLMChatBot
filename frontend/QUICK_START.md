# Быстрый старт Frontend

## Установка зависимостей

```bash
cd frontend
npm install
```

## Разработка

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

## Сборка для production

```bash
npm run build
```

Собранные файлы будут в папке `dist/`. Backend автоматически подхватит их при запуске в production режиме.

## Переменные окружения

Создайте файл `.env`:

```env
VITE_API_URL=http://localhost:8080
```

## Структура

- `src/components/` - React компоненты
- `src/hooks/` - Кастомные хуки
- `src/services/` - API сервисы
- `src/stores/` - Redux store
- `src/types/` - TypeScript типы

