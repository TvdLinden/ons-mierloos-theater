-- Add unsubscribe_token to mailing_list_subscribers
ALTER TABLE IF EXISTS public.mailing_list_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token varchar(255);

-- Backfill existing rows with a random token if not present
UPDATE public.mailing_list_subscribers
SET unsubscribe_token = gen_random_uuid()::text
WHERE unsubscribe_token IS NULL;

-- Add index for fast lookup
CREATE INDEX IF NOT EXISTS mailing_list_unsubscribe_token_idx ON public.mailing_list_subscribers (unsubscribe_token);
