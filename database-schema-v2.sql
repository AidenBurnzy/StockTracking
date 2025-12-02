-- Trading Tracker Database Schema V2 - Multi-Partner Support
-- This schema supports unlimited partners dynamically

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT 'blue', -- For UI theming (red, cyan, green, purple, etc.)
    total_invested DECIMAL(10, 2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entries table (simplified - no hardcoded partner columns)
CREATE TABLE IF NOT EXISTS entries_v2 (
    id SERIAL PRIMARY KEY,
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entry_type VARCHAR(20) NOT NULL, -- 'trade', 'capital', 'withdrawal'
    portfolio_value DECIMAL(10, 2) NOT NULL,
    
    -- Trade details (optional)
    ticker VARCHAR(20),
    trade_type VARCHAR(20), -- 'Call', 'Put', 'Stock'
    contracts VARCHAR(50),
    notes TEXT,
    daily_pl DECIMAL(10, 2),
    
    -- Capital transaction details (optional)
    capital_person VARCHAR(50),
    capital_amount DECIMAL(10, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner snapshots - stores each partner's state at each entry
CREATE TABLE IF NOT EXISTS partner_snapshots (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES entries_v2(id) ON DELETE CASCADE,
    partner_name VARCHAR(50) NOT NULL,
    capital DECIMAL(10, 2) NOT NULL,
    ownership DECIMAL(5, 2) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    pl DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entry_id, partner_name)
);

-- Initialize default partners (Nick and Joey)
INSERT INTO partners (name, display_name, color, total_invested) VALUES 
    ('nick', 'Nick', 'red', 600.00),
    ('joey', 'Joey', 'cyan', 0.00)
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_entries_v2_date ON entries_v2(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_v2_type ON entries_v2(entry_type);
CREATE INDEX IF NOT EXISTS idx_partner_snapshots_entry ON partner_snapshots(entry_id);
CREATE INDEX IF NOT EXISTS idx_partner_snapshots_partner ON partner_snapshots(partner_name);

-- View for current partner states
CREATE OR REPLACE VIEW current_partners AS
SELECT 
    name,
    display_name,
    color,
    total_invested,
    active,
    updated_at
FROM partners
WHERE active = TRUE
ORDER BY name;
