-- Fix recursive RLS for spaces by using SECURITY DEFINER helper functions

-- Helper: check membership without causing RLS recursion
CREATE OR REPLACE FUNCTION public.is_member_of_circle(p_circle_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = p_circle_id AND user_id = p_user_id AND is_active = true
  ) INTO v_exists;
  RETURN v_exists;
END;
$$;

-- Helper: check admin role without causing RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin_of_circle(p_circle_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = p_circle_id AND user_id = p_user_id AND role = 'admin' AND is_active = true
  ) INTO v_exists;
  RETURN v_exists;
END;
$$;

-- Tighten permissions
REVOKE ALL ON FUNCTION public.is_member_of_circle(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin_of_circle(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of_circle(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_of_circle(uuid, uuid) TO anon, authenticated;

-- Replace recursive policies
DROP POLICY IF EXISTS "Users can view circles they're members of" ON friend_circles;
CREATE POLICY "Users can view circles they're members of" ON friend_circles
  FOR SELECT USING (
    public.is_member_of_circle(id, auth.uid())
  );

DROP POLICY IF EXISTS "Circle admins can update circles" ON friend_circles;
CREATE POLICY "Circle admins can update circles" ON friend_circles
  FOR UPDATE USING (
    public.is_admin_of_circle(id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can view members of their circles" ON circle_members;
CREATE POLICY "Users can view members of their circles" ON circle_members
  FOR SELECT USING (
    public.is_member_of_circle(circle_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can view circle sidequests" ON social_sidequests;
CREATE POLICY "Users can view circle sidequests" ON social_sidequests
  FOR SELECT USING (
    visibility = 'circle' AND public.is_member_of_circle(circle_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can view activities for accessible sidequests" ON sidequest_activities;
CREATE POLICY "Users can view activities for accessible sidequests" ON sidequest_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.social_sidequests s
      WHERE s.id = sidequest_id
        AND (
          s.created_by = auth.uid()
          OR s.visibility = 'public'
          OR (s.visibility = 'circle' AND public.is_member_of_circle(s.circle_id, auth.uid()))
        )
    )
  );

DROP POLICY IF EXISTS "Users can create activities for accessible sidequests" ON sidequest_activities;
CREATE POLICY "Users can create activities for accessible sidequests" ON sidequest_activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.social_sidequests s
      WHERE s.id = sidequest_id
        AND (
          s.created_by = auth.uid()
          OR s.visibility = 'public'
          OR (s.visibility = 'circle' AND public.is_member_of_circle(s.circle_id, auth.uid()))
        )
    )
  );

-- Done

