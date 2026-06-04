-- Add assessment fields to buildings
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS year_built         integer,
  ADD COLUMN IF NOT EXISTS square_footage     integer,
  ADD COLUMN IF NOT EXISTS number_of_floors   integer,
  ADD COLUMN IF NOT EXISTS construction_type  text;

-- Add assessment fields to assets
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS priority           text CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS quantity           integer,
  ADD COLUMN IF NOT EXISTS install_year       integer,
  ADD COLUMN IF NOT EXISTS expected_lifespan  integer,
  ADD COLUMN IF NOT EXISTS warranty_expiry    date,
  ADD COLUMN IF NOT EXISTS last_service_date  date;
