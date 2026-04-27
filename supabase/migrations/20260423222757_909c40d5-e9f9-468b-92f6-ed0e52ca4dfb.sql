-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- 2. Transactions (deposits + withdrawals)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit','withdrawal')),
  method text NOT NULL,
  amount_usd numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  wallet_address text,
  bank_details jsonb,
  card_last4 text,
  proof_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx view own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tx insert own" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tx_updated BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. KYC submissions
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_type text NOT NULL,
  document_number text,
  id_front_url text,
  id_back_url text,
  selfie_url text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kyc view own" ON public.kyc_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "kyc insert own" ON public.kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kyc update own" ON public.kyc_submissions FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER kyc_updated BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Expert traders (public read)
CREATE TABLE IF NOT EXISTS public.expert_traders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  handle text NOT NULL,
  avatar_url text,
  bio text,
  specialty text,
  win_rate numeric NOT NULL DEFAULT 0,
  total_profit_usd numeric NOT NULL DEFAULT 0,
  followers integer NOT NULL DEFAULT 0,
  min_copy_amount numeric NOT NULL DEFAULT 100,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expert_traders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experts public read" ON public.expert_traders FOR SELECT USING (true);

-- 5. Copy subscriptions
CREATE TABLE IF NOT EXISTS public.copy_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  expert_id uuid NOT NULL REFERENCES public.expert_traders(id) ON DELETE CASCADE,
  allocated_usd numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.copy_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copy view own" ON public.copy_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "copy insert own" ON public.copy_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "copy update own" ON public.copy_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER copy_updated BEFORE UPDATE ON public.copy_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Trading plans (public read)
CREATE TABLE IF NOT EXISTS public.trading_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  roi_percent numeric NOT NULL,
  duration_days integer NOT NULL,
  min_amount_usd numeric NOT NULL,
  max_amount_usd numeric NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  badge text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.trading_plans FOR SELECT USING (true);

-- 7. Plan subscriptions
CREATE TABLE IF NOT EXISTS public.plan_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.trading_plans(id) ON DELETE CASCADE,
  amount_usd numeric NOT NULL,
  expected_return_usd numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps view own" ON public.plan_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ps insert own" ON public.plan_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ps_updated BEFORE UPDATE ON public.plan_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Storage bucket for KYC docs (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "kyc upload own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "kyc read own" ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 9. Update handle_new_user trigger function to include gender + phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  RETURN NEW;
END;
$function$;

-- 10. Seed expert traders
INSERT INTO public.expert_traders (name, handle, avatar_url, bio, specialty, win_rate, total_profit_usd, followers, min_copy_amount, sort_order) VALUES
('Elon Musk','@elonmusk',null,'Visionary investor. Tech-heavy portfolio.','Tech & EV',94.2,12480000,184320,500,1),
('Cathie Wood','@cathiewood',null,'Disruptive innovation strategist.','Innovation ETFs',88.6,4820000,92140,250,2),
('Michael Saylor','@saylor',null,'Bitcoin maximalist. Long-only conviction.','Crypto',91.3,7210000,73210,300,3),
('Linda Chen','@lindafx',null,'Macro FX & commodities specialist.','FX / Macro',86.1,2140000,41280,150,4),
('Rakesh Patel','@rakesh_p',null,'High-frequency equity scalper.','Equities',82.4,1340000,28940,100,5),
('Sofia Marín','@sofiam',null,'Emerging markets growth analyst.','Emerging Markets',79.8,980000,18420,100,6);

-- 11. Seed trading plans
INSERT INTO public.trading_plans (name, tagline, roi_percent, duration_days, min_amount_usd, max_amount_usd, features, badge, sort_order) VALUES
('Starter','For first-time investors',8,7,100,999,'["Daily insights","Email support","Auto-compound"]'::jsonb,null,1),
('Growth','Balanced risk and reward',18,14,1000,9999,'["Priority support","Weekly rebalancing","Tesla rewards"]'::jsonb,'Popular',2),
('Premium','Accelerated portfolio growth',32,21,10000,49999,'["Dedicated manager","Daily rebalancing","Tesla discount"]'::jsonb,null,3),
('Elite','Concierge wealth tier',55,30,50000,1000000,'["1:1 strategist","Tesla included","White-glove KYC"]'::jsonb,'VIP',4);