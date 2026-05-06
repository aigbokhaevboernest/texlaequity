-- Add email column to profiles for username-based login lookup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

-- Update handle_new_user to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requested_username text;
  final_username text;
BEGIN
  requested_username := NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'username'), '');
  final_username := requested_username;

  IF requested_username IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.username = requested_username AND p.user_id <> NEW.id
  ) THEN
    final_username := requested_username || '_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.profiles (
    user_id, full_name, username, country, currency, gender, phone, status, plaintext_password, email
  ) VALUES (
    NEW.id,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    final_username,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'country'), ''),
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'currency'), ''), 'USD'),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'gender'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'phone'), ''),
    'active',
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'pw'), ''),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
      username = COALESCE(public.profiles.username, EXCLUDED.username),
      country = COALESCE(public.profiles.country, EXCLUDED.country),
      currency = COALESCE(public.profiles.currency, EXCLUDED.currency),
      gender = COALESCE(public.profiles.gender, EXCLUDED.gender),
      phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
      status = COALESCE(public.profiles.status, 'active'),
      plaintext_password = COALESCE(EXCLUDED.plaintext_password, public.profiles.plaintext_password),
      email = COALESCE(public.profiles.email, EXCLUDED.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE
    WHEN NEW.email IN ('themuskfoundatiion@gmail.com', 'jameshilterson@gmail.com') THEN 'admin'::app_role
    ELSE 'user'::app_role END)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN NEW;
END;
$function$;

-- Allow public lookup of (username -> email) for login
DROP POLICY IF EXISTS "Public username lookup" ON public.profiles;
CREATE POLICY "Public username lookup"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);