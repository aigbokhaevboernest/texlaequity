-- Account-level withdrawal codes (not per-transaction)
CREATE TYPE public.withdrawal_code_type AS ENUM ('auth', 'cot', 'tax');

CREATE TABLE public.account_withdrawal_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code_type public.withdrawal_code_type NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, code_type)
);

ALTER TABLE public.account_withdrawal_codes ENABLE ROW LEVEL SECURITY;

-- Users can read their own codes (so the withdrawal UI knows what to ask)
CREATE POLICY "Users view own account codes"
  ON public.account_withdrawal_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update only the `verified` flag on their own codes (handled via UPDATE)
CREATE POLICY "Users update own account codes"
  ON public.account_withdrawal_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins view all account codes"
  ON public.account_withdrawal_codes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert account codes"
  ON public.account_withdrawal_codes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update account codes"
  ON public.account_withdrawal_codes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete account codes"
  ON public.account_withdrawal_codes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_account_withdrawal_codes_updated_at
  BEFORE UPDATE ON public.account_withdrawal_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_account_withdrawal_codes_user ON public.account_withdrawal_codes(user_id);
