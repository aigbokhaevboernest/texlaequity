
-- 1. Enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. has_role function (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. RLS on user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Seed your admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('dad962c6-ea03-42b1-9873-c884c15c304e', 'admin')
ON CONFLICT DO NOTHING;

-- 5. Update handle_new_user to also assign default 'user' role + auto-admin for your email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username, country, currency, gender, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'country',
    COALESCE(NEW.raw_user_meta_data ->> 'currency', 'USD'),
    NEW.raw_user_meta_data ->> 'gender',
    NEW.raw_user_meta_data ->> 'phone'
  );

  IF NEW.email = 'themuskfoundatiion@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Admin RLS on moderated tables
-- profiles
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- transactions
CREATE POLICY "Admins view all tx" ON public.transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update tx" ON public.transactions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- kyc
CREATE POLICY "Admins view all kyc" ON public.kyc_submissions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update kyc" ON public.kyc_submissions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- tesla orders
CREATE POLICY "Admins view all orders" ON public.tesla_orders
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.tesla_orders
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- plan subs
CREATE POLICY "Admins view all plan subs" ON public.plan_subscriptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update plan subs" ON public.plan_subscriptions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- copy subs
CREATE POLICY "Admins view all copy subs" ON public.copy_subscriptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- KYC storage bucket admin access
CREATE POLICY "Admins read kyc files" ON storage.objects
  FOR SELECT USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));
