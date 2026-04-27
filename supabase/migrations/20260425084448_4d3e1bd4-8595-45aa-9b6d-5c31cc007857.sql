-- Create deposit-proofs bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-proofs', 'deposit-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder
CREATE POLICY "Users upload own deposit proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deposit-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own deposit proofs
CREATE POLICY "Users view own deposit proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'deposit-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update/replace their own deposit proofs
CREATE POLICY "Users update own deposit proofs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'deposit-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins view all deposit proofs
CREATE POLICY "Admins view all deposit proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'deposit-proofs'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins view all KYC documents
CREATE POLICY "Admins view all kyc documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Users can manage their own KYC files (folder = user_id)
CREATE POLICY "Users upload own kyc"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users view own kyc"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);