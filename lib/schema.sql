-- Server-managed storage: browser clients use the authorized website API.
CREATE TABLE IF NOT EXISTS public.dss_state (
  id integer PRIMARY KEY CHECK (id = 1),
  data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.dss_files (
  name text PRIMARY KEY,
  data bytea NOT NULL
);
ALTER TABLE public.dss_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dss_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.dss_state, public.dss_files FROM PUBLIC;
DO $permissions$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.dss_state, public.dss_files FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.dss_state, public.dss_files FROM authenticated;
  END IF;
END
$permissions$;
