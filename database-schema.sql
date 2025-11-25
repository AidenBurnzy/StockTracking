-- Trading Tracker Database Schema
-- Run this in your Neon SQL Editor

-- Create capital tracking table
CREATE TABLE IF NOT EXISTS capital (
    id SERIAL PRIMARY KEY,
    person VARCHAR(50) NOT NULL,
    total_invested DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create entries table for trades and capital injections
CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entry_type VARCHAR(20) NOT NULL, -- 'trade' or 'capital'
    portfolio_value DECIMAL(10, 2) NOT NULL,
    
    -- Trade details (optional)
    ticker VARCHAR(20),
    trade_type VARCHAR(20), -- 'Call', 'Put', 'Stock'
    contracts VARCHAR(50),
    notes TEXT,
    daily_pl DECIMAL(10, 2),
    
    -- Capital injection details (optional)
    capital_person VARCHAR(50),
    capital_amount DECIMAL(10, 2),
    
    -- Snapshot of ownership at time of entry
    nick_capital DECIMAL(10, 2) NOT NULL,
    joey_capital DECIMAL(10, 2) NOT NULL,
    nick_ownership DECIMAL(5, 2) NOT NULL,
    joey_ownership DECIMAL(5, 2) NOT NULL,
    nick_value DECIMAL(10, 2) NOT NULL,
    joey_value DECIMAL(10, 2) NOT NULL,
    nick_pl DECIMAL(10, 2) NOT NULL,
    joey_pl DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize capital for Nick and Joey
INSERT INTO capital (person, total_invested) VALUES 
    ('nick', 600.00),
    ('joey', 0.00)
ON CONFLICT DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(entry_type);

-- View to get current capital state
CREATE OR REPLACE VIEW current_capital AS
SELECT 
    person,
    total_invested,
    updated_at
FROM capital
ORDER BY person;
