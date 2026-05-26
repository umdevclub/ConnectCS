DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE;', table_record.tablename);
  END LOOP;
END
$$;

CREATE TABLE public.companies (
  name text PRIMARY KEY
);

CREATE TABLE public.contact_types (
  name text PRIMARY KEY
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  start_term text NOT NULL,
  end_term text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.experience (
  profile uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  company text NOT NULL REFERENCES public.companies (name) ON DELETE CASCADE,
  type text NOT NULL,
  PRIMARY KEY (profile, company, type)
);

CREATE TABLE public.contacts (
  profile uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  contact_type text NOT NULL REFERENCES public.contact_types (name) ON DELETE CASCADE,
  contact text NOT NULL,
  PRIMARY KEY (profile, contact_type, contact)
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view companies"
ON public.companies
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can view contact types"
ON public.contact_types
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Anyone can view experience"
ON public.experience
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert own experience"
ON public.experience
FOR INSERT
TO authenticated
WITH CHECK (profile = auth.uid());

CREATE POLICY "Users can update own experience"
ON public.experience
FOR UPDATE
TO authenticated
USING (profile = auth.uid())
WITH CHECK (profile = auth.uid());

CREATE POLICY "Users can delete own experience"
ON public.experience
FOR DELETE
TO authenticated
USING (profile = auth.uid());

CREATE POLICY "Anyone can view contacts"
ON public.contacts
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert own contacts"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (profile = auth.uid());

CREATE POLICY "Users can update own contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (profile = auth.uid())
WITH CHECK (profile = auth.uid());

CREATE POLICY "Users can delete own contacts"
ON public.contacts
FOR DELETE
TO authenticated
USING (profile = auth.uid());
