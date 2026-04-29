-- Lock down role assignment so it can ONLY happen from the backend (SQL editor /
-- service role), never from the client UI.

-- 1. Drop the RPC the UI used to call. Even though the button is gone,
--    removing the function ensures no client (curl, Postman, JS) can invoke it.
DROP FUNCTION IF EXISTS public.admin_set_role(uuid, app_role);

-- 2. Replace the permissive "Admins manage roles" ALL-policy on user_roles with
--    read-only access. Inserts/updates/deletes on user_roles must now be done
--    by a Postgres superuser (Supabase SQL editor) or via the service-role key,
--    both of which bypass RLS. No client session — admin or otherwise — can
--    mutate roles.
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- "Users view own roles" policy already exists and is kept as-is.
-- No INSERT / UPDATE / DELETE policies = no client-side role mutation possible.