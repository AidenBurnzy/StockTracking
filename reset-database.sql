-- Fresh start: Drop everything and recreate with the old schema
-- WARNING: This will delete all data!

DROP TABLE IF EXISTS entry_partner_snapshots CASCADE;
DROP TABLE IF EXISTS partner_snapshots CASCADE;
DROP TABLE IF EXISTS entries CASCADE;
DROP TABLE IF EXISTS entries_v2 CASCADE;
DROP TABLE IF EXISTS entries_old CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS capital CASCADE;
DROP TABLE IF EXISTS capital_old CASCADE;

-- Now run database-schema.sql to recreate the original tables
