-- Align profile column names with spec
ALTER TABLE public.profiles RENAME COLUMN balance TO total_balance;
ALTER TABLE public.profiles RENAME COLUMN total_deposit TO deposit;

-- Add is_active to expert_traders per spec
ALTER TABLE public.expert_traders ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Enable realtime on profiles & transactions so frontend sees instant updates
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='profiles') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='transactions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions';
  END IF;
END $$;