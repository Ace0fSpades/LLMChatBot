-- ============================================
-- SQL скрипт для инициализации базы данных
-- ============================================
-- Выполните этот скрипт от имени суперпользователя PostgreSQL (обычно postgres)
-- 
-- Использование:
-- psql -U postgres -f scripts/init_db.sql
-- или
-- psql -U postgres
-- \i scripts/init_db.sql
-- ============================================

-- Создание пользователя (если не существует)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'chat_app_user') THEN
        CREATE USER chat_app_user WITH PASSWORD 'your_password_here';
        RAISE NOTICE 'User chat_app_user created';
    ELSE
        RAISE NOTICE 'User chat_app_user already exists';
    END IF;
END
$$;

-- Создание базы данных (если не существует)
SELECT 'CREATE DATABASE chat_db OWNER chat_app_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chat_db')\gexec

-- Подключение к созданной базе данных
\c chat_db

-- Предоставление прав пользователю
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_app_user;
GRANT ALL ON SCHEMA public TO chat_app_user;

-- Включение расширений (если нужно)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Сообщение об успешном завершении
\echo 'Database initialization completed successfully!'
\echo 'Please update the password in your .env file to match the one set above.'

