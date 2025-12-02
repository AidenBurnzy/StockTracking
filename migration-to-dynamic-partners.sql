-- Migration Script: Convert to Dynamic Multi-Partner Support
-- Run this script on your Neon database

-- Step 1: Create new tables
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT 'blue',
    total_invested DECIMAL(10, 2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entries_v2 (
    id SERIAL PRIMARY KEY,
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entry_type VARCHAR(20) NOT NULL,
    portfolio_value DECIMAL(10, 2) NOT NULL,
    ticker VARCHAR(20),
    trade_type VARCHAR(20),
    contracts VARCHAR(50),
    notes TEXT,
    daily_pl DECIMAL(10, 2),
    capital_person VARCHAR(50),
    capital_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Step 2: Migrate existing capital data to partners table
INSERT INTO partners (name, display_name, color, total_invested)
SELECT 'nick', 'Nick', 'red', total_invested FROM capital WHERE person = 'nick'
ON CONFLICT (name) DO UPDATE SET total_invested = EXCLUDED.total_invested;

INSERT INTO partners (name, display_name, color, total_invested)
SELECT 'joey', 'Joey', 'cyan', total_invested FROM capital WHERE person = 'joey'
ON CONFLICT (name) DO UPDATE SET total_invested = EXCLUDED.total_invested;

-- Step 3: Migrate existing entries to new structure
INSERT INTO entries_v2 (
    id, entry_date, entry_type, portfolio_value, ticker, trade_type, 
    contracts, notes, daily_pl, capital_person, capital_amount, created_at
)
SELECT 
    id, entry_date, entry_type, portfolio_value, ticker, trade_type,
    contracts, notes, daily_pl, capital_person, capital_amount, created_at
FROM entries;

-- Step 4: Migrate partner snapshots for Nick
INSERT INTO partner_snapshots (entry_id, partner_name, capital, ownership, value, pl)
SELECT 
    id,
    'nick',
    nick_capital,
    nick_ownership,
    nick_value,
    nick_pl
FROM entries;

-- Step 5: Migrate partner snapshots for Joey
INSERT INTO partner_snapshots (entry_id, partner_name, capital, ownership, value, pl)
SELECT 
    id,
    'joey',
    joey_capital,
    joey_ownership,
    joey_value,
    joey_pl
FROM entries;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_entries_v2_date ON entries_v2(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_v2_type ON entries_v2(entry_type);
CREATE INDEX IF NOT EXISTS idx_partner_snapshots_entry ON partner_snapshots(entry_id);
CREATE INDEX IF NOT EXISTS idx_partner_snapshots_partner ON partner_snapshots(partner_name);

-- Step 7: Rename old tables (backup)
ALTER TABLE entries RENAME TO entries_old;
ALTER TABLE capital RENAME TO capital_old;

-- Step 8: Rename new tables to primary names
ALTER TABLE entries_v2 RENAME TO entries;
ALTER TABLE partner_snapshots RENAME TO entry_partner_snapshots;

-- Note: To rollback, reverse steps 7-8 and drop the new tables
-- To complete migration, after verifying everything works, drop old tables:
-- DROP TABLE entries_old CASCADE;
-- DROP TABLE capital_old CASCADE;

SELECT 'Migration completed successfully!' as status;
