-- Remember released subdomains so a name one site gives up cannot be
-- grabbed by a different project right away (anti-impersonation hold).
CREATE TABLE IF NOT EXISTS project_subdomain_history (
  subdomain   text PRIMARY KEY,
  project_id  uuid NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now()
);
