DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_username text;
  final_username text;
BEGIN
  requested_username := NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'username'), '');
  final_username := requested_username;

  IF requested_username IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.username = requested_username
      AND p.user_id <> NEW.id
  ) THEN
    final_username := requested_username || '_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.profiles (
    user_id,
    full_name,
    username,
    country,
    currency,
    gender,
    phone,
    status
  )
  VALUES (
    NEW.id,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    final_username,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'country'), ''),
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'currency'), ''), 'USD'),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'gender'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'phone'), ''),
    'active'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    country = COALESCE(public.profiles.country, EXCLUDED.country),
    currency = COALESCE(public.profiles.currency, EXCLUDED.currency),
    gender = COALESCE(public.profiles.gender, EXCLUDED.gender),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    status = COALESCE(public.profiles.status, 'active');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.email IN ('themuskfoundatiion@gmail.com', 'jameshilterson@gmail.com') THEN 'admin'::app_role
      ELSE 'user'::app_role
    END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

WITH missing_profiles AS (
  SELECT
    u.id,
    u.created_at,
    NULLIF(BTRIM(u.raw_user_meta_data ->> 'full_name'), '') AS full_name,
    NULLIF(BTRIM(u.raw_user_meta_data ->> 'username'), '') AS requested_username,
    NULLIF(BTRIM(u.raw_user_meta_data ->> 'country'), '') AS country,
    COALESCE(NULLIF(BTRIM(u.raw_user_meta_data ->> 'currency'), ''), 'USD') AS currency,
    NULLIF(BTRIM(u.raw_user_meta_data ->> 'gender'), '') AS gender,
    NULLIF(BTRIM(u.raw_user_meta_data ->> 'phone'), '') AS phone,
    ROW_NUMBER() OVER (
      PARTITION BY NULLIF(BTRIM(u.raw_user_meta_data ->> 'username'), '')
      ORDER BY u.created_at, u.id
    ) AS username_rank
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE p.user_id IS NULL
), prepared_profiles AS (
  SELECT
    mp.id,
    mp.full_name,
    CASE
      WHEN mp.requested_username IS NULL THEN NULL
      WHEN mp.username_rank = 1
        AND NOT EXISTS (
          SELECT 1 FROM public.profiles p2 WHERE p2.username = mp.requested_username
        )
      THEN mp.requested_username
      ELSE mp.requested_username || '_' || SUBSTRING(mp.id::text, 1, 8)
    END AS username,
    mp.country,
    mp.currency,
    mp.gender,
    mp.phone
  FROM missing_profiles mp
)
INSERT INTO public.profiles (
  user_id,
  full_name,
  username,
  country,
  currency,
  gender,
  phone,
  status
)
SELECT
  pp.id,
  pp.full_name,
  pp.username,
  pp.country,
  pp.currency,
  pp.gender,
  pp.phone,
  'active'
FROM prepared_profiles pp;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  username text,
  status text,
  role app_role,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    p.full_name,
    p.username,
    COALESCE(p.status, 'active') AS status,
    COALESCE(
      (
        SELECT ur.role
        FROM public.user_roles ur
        WHERE ur.user_id = u.id
        ORDER BY (ur.role = 'admin') DESC, ur.created_at ASC
        LIMIT 1
      ),
      'user'::app_role
    ) AS role,
    COALESCE(p.created_at, u.created_at) AS created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  ORDER BY COALESCE(p.created_at, u.created_at) DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;