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
    p.user_id,
    u.email::text,
    p.full_name,
    p.username,
    p.status,
    COALESCE(
      (SELECT ur.role FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
        ORDER BY (ur.role = 'admin') DESC
        LIMIT 1),
      'user'::app_role
    ) AS role,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Admin role-management helper: set or remove admin role for a user
CREATE OR REPLACE FUNCTION public.admin_set_role(_target_user uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Wipe existing roles for the user, then insert the new one.
  DELETE FROM public.user_roles WHERE user_id = _target_user;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user, _role);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, app_role) TO authenticated;