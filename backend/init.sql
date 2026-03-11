-- BALANSIM Database Schema
-- Oilaviy Byudjet (Family Budget) Application

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('cash', 'card', 'deposit');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
        CREATE TYPE category_type AS ENUM ('income', 'expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'debt_type') THEN
        CREATE TYPE debt_type AS ENUM ('lent', 'borrowed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'debt_status') THEN
        CREATE TYPE debt_status AS ENUM ('active', 'paid');
    END IF;
END $$;

-- Families
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    pin_code VARCHAR(255),
    avatar_url VARCHAR(500),
    currency VARCHAR(3) DEFAULT 'UZS',
    role user_role DEFAULT 'owner',
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    theme VARCHAR(10) DEFAULT 'light',
    language VARCHAR(5) DEFAULT 'uz',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add owner_id to families after users table created (conditional check for column)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='families' AND column_name='owner_id') THEN
        ALTER TABLE families ADD COLUMN owner_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Sessions (Device Logins)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Accounts (Wallets)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type account_type DEFAULT 'cash',
    currency VARCHAR(3) DEFAULT 'UZS',
    balance DECIMAL(15,2) DEFAULT 0.00,
    icon VARCHAR(50) DEFAULT 'wallet',
    color VARCHAR(7) DEFAULT '#4F46E5',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'tag',
    color VARCHAR(7) DEFAULT '#6366F1',
    type category_type NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    description TEXT,
    date TIMESTAMP DEFAULT NOW(),
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Debts
CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20),
    type debt_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    remaining DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    due_date DATE,
    notes TEXT,
    status debt_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Goals (Savings)
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'UZS',
    deadline DATE,
    icon VARCHAR(50) DEFAULT 'target',
    color VARCHAR(7) DEFAULT '#10B981',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_debts_user ON debts(user_id);
CREATE INDEX idx_goals_user ON goals(user_id);

-- Default Categories (Expense)
INSERT INTO categories (name, icon, color, type, is_default) VALUES
('Ovqat', 'utensils', '#EF4444', 'expense', true),
('Transport', 'car', '#F59E0B', 'expense', true),
('Uy-joy', 'home', '#3B82F6', 'expense', true),
('Kiyim', 'shirt', '#8B5CF6', 'expense', true),
('Salomatlik', 'heart-pulse', '#EC4899', 'expense', true),
('Ta''lim', 'graduation-cap', '#06B6D4', 'expense', true),
('O''yin-kulgi', 'gamepad-2', '#F97316', 'expense', true),
('Kommunal', 'zap', '#14B8A6', 'expense', true),
('Aloqa', 'phone', '#6366F1', 'expense', true),
('Boshqa', 'more-horizontal', '#64748B', 'expense', true);

-- Default Categories (Income)
INSERT INTO categories (name, icon, color, type, is_default) VALUES
('Maosh', 'banknote', '#10B981', 'income', true),
('Freelance', 'laptop', '#3B82F6', 'income', true),
('Biznes', 'briefcase', '#F59E0B', 'income', true),
('Sovg''a', 'gift', '#EC4899', 'income', true),
('Investitsiya', 'trending-up', '#8B5CF6', 'income', true),
('Boshqa daromad', 'plus-circle', '#64748B', 'income', true);

-- Default Sub-categories
INSERT INTO categories (name, icon, color, type, parent_id, is_default) 
SELECT 'Bozor', 'shopping-cart', '#EF4444', 'expense', id, true FROM categories WHERE name = 'Ovqat' AND parent_id IS NULL AND is_default = true;
INSERT INTO categories (name, icon, color, type, parent_id, is_default)
SELECT 'Restoran', 'utensils-crossed', '#DC2626', 'expense', id, true FROM categories WHERE name = 'Ovqat' AND parent_id IS NULL AND is_default = true;
INSERT INTO categories (name, icon, color, type, parent_id, is_default)
SELECT 'Supermarket', 'store', '#B91C1C', 'expense', id, true FROM categories WHERE name = 'Ovqat' AND parent_id IS NULL AND is_default = true;
INSERT INTO categories (name, icon, color, type, parent_id, is_default)
SELECT 'Benzin', 'fuel', '#D97706', 'expense', id, true FROM categories WHERE name = 'Transport' AND parent_id IS NULL AND is_default = true;
INSERT INTO categories (name, icon, color, type, parent_id, is_default)
SELECT 'Taxi', 'car-taxi-front', '#B45309', 'expense', id, true FROM categories WHERE name = 'Transport' AND parent_id IS NULL AND is_default = true;
INSERT INTO categories (name, icon, color, type, parent_id, is_default)
SELECT 'Ijara', 'key', '#2563EB', 'expense', id, true FROM categories WHERE name = 'Uy-joy' AND parent_id IS NULL AND is_default = true;
