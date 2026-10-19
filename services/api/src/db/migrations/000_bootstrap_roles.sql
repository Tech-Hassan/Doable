-- Migration 000 (bootstrap): roles + extensions the rest of the chain expects.
--
-- In the docker-compose setup these are created at first DB init by
-- deployment/docker/init.sql (extensions) and 02-roles.sh (roles). On Railway
-- the postgres image is used bare, so neither ever runs and migration 047+
-- fails with: role "doable" does not exist. Creating them here (idempotent,
-- sorts before 001) makes the chain work on any host.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'doable') THEN
    CREATE ROLE doable LOGIN SUPERUSER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'doable_app') THEN
    CREATE ROLE doable_app LOGIN;
  END IF;
END
$$;

-- Runtime role grants (mirror of 02-roles.sh, owner here is the connecting
-- superuser rather than the "doable" role used in the compose layout).
GRANT CONNECT ON DATABASE postgres TO doable_app;
GRANT USAGE ON SCHEMA public TO doable_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO doable_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO doable_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO doable_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO doable_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO doable_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO doable_app;
