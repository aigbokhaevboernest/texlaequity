-- Profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  profit NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_deposit NUMERIC(18,2) NOT NULL DEFAULT 0,
  account_level TEXT NOT NULL DEFAULT 'Basic',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username, country, currency)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'country',
    COALESCE(NEW.raw_user_meta_data ->> 'currency', 'USD')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tesla cars catalog (publicly readable)
CREATE TABLE public.tesla_cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model TEXT NOT NULL,
  tagline TEXT,
  price_usd NUMERIC(12,2) NOT NULL,
  range_mi INT,
  top_speed INT,
  zero_to_sixty NUMERIC(3,1),
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tesla_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cars are publicly viewable" ON public.tesla_cars
  FOR SELECT USING (true);

-- Orders
CREATE TABLE public.tesla_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.tesla_cars(id),
  buyer_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount_usd NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tesla_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders" ON public.tesla_orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.tesla_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_tesla_orders_updated_at
  BEFORE UPDATE ON public.tesla_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed cars
INSERT INTO public.tesla_cars (model, tagline, price_usd, range_mi, top_speed, zero_to_sixty, sort_order) VALUES
  ('Model S', 'Plaid performance, redefined.', 79990, 405, 200, 1.99, 1),
  ('Model 3', 'Pure electric, accessibly fast.', 38990, 358, 162, 2.9, 2),
  ('Model X', 'Falcon wings. Family-sized power.', 79990, 348, 163, 2.5, 3),
  ('Cybertruck', 'Built for any planet.', 79990, 340, 130, 2.6, 4),
  ('Tesla Semi', 'The future of freight, electrified.', 180000, 500, 105, 5.0, 5);