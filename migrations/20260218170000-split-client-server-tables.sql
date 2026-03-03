CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.sidequest_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sidequest_id uuid NOT NULL REFERENCES public.sidequest_activities(id) ON DELETE CASCADE,
  requester_id uuid,
  requester_name text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sidequest_join_requests_unique_request UNIQUE (sidequest_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_sidequest_join_requests_sidequest_id
  ON public.sidequest_join_requests(sidequest_id);

CREATE INDEX IF NOT EXISTS idx_sidequest_join_requests_status
  ON public.sidequest_join_requests(status);

CREATE TABLE IF NOT EXISTS public.host_follows (
  host_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  follower_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (host_user_id, follower_id)
);

CREATE INDEX IF NOT EXISTS idx_host_follows_follower_id
  ON public.host_follows(follower_id);

CREATE OR REPLACE FUNCTION public.touch_sidequest_join_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sidequest_join_requests_updated_at ON public.sidequest_join_requests;
CREATE TRIGGER tr_sidequest_join_requests_updated_at
BEFORE UPDATE ON public.sidequest_join_requests
FOR EACH ROW
EXECUTE FUNCTION public.touch_sidequest_join_requests_updated_at();

ALTER TABLE public.sidequest_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view join requests" ON public.sidequest_join_requests;
CREATE POLICY "Users can view join requests" ON public.sidequest_join_requests
FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can create join requests" ON public.sidequest_join_requests;
CREATE POLICY "Users can create join requests" ON public.sidequest_join_requests
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Hosts can update join requests" ON public.sidequest_join_requests;
CREATE POLICY "Hosts can update join requests" ON public.sidequest_join_requests
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view follows" ON public.host_follows;
CREATE POLICY "Users can view follows" ON public.host_follows
FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can follow hosts" ON public.host_follows;
CREATE POLICY "Users can follow hosts" ON public.host_follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow hosts" ON public.host_follows;
CREATE POLICY "Users can unfollow hosts" ON public.host_follows
FOR DELETE
USING (auth.uid() = follower_id);
