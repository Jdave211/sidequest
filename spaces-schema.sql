-- Spaces Database Schema for Sidequest App
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SPACES (FRIEND CIRCLES) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS friend_circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 50
);

-- ============================================================================
-- SPACE MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES friend_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(circle_id, user_id)
);

-- ============================================================================
-- SIDEQUESTS IN SPACES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_sidequests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES friend_circles(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'circle' CHECK (visibility IN ('private', 'circle', 'public')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  image_url TEXT,
  review TEXT
);

-- ============================================================================
-- ACTIVITY FEED TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sidequest_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sidequest_id UUID NOT NULL REFERENCES social_sidequests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'started', 'updated', 'completed', 'commented')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_friend_circles_code ON friend_circles(code);
CREATE INDEX IF NOT EXISTS idx_friend_circles_created_by ON friend_circles(created_by);
CREATE INDEX IF NOT EXISTS idx_friend_circles_active ON friend_circles(is_active);

CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_active ON circle_members(is_active);

CREATE INDEX IF NOT EXISTS idx_social_sidequests_created_by ON social_sidequests(created_by);
CREATE INDEX IF NOT EXISTS idx_social_sidequests_circle_id ON social_sidequests(circle_id);
CREATE INDEX IF NOT EXISTS idx_social_sidequests_status ON social_sidequests(status);

CREATE INDEX IF NOT EXISTS idx_sidequest_activities_sidequest_id ON sidequest_activities(sidequest_id);
CREATE INDEX IF NOT EXISTS idx_sidequest_activities_user_id ON sidequest_activities(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE friend_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_sidequests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidequest_activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FRIEND CIRCLES POLICIES
-- ============================================================================

-- Users can view circles they're members of
CREATE POLICY "Users can view circles they're members of" ON friend_circles
  FOR SELECT USING (
    id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can create circles
CREATE POLICY "Users can create circles" ON friend_circles
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Circle admins can update circles
CREATE POLICY "Circle admins can update circles" ON friend_circles
  FOR UPDATE USING (
    id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- ============================================================================
-- CIRCLE MEMBERS POLICIES
-- ============================================================================

-- Users can view members of their circles
CREATE POLICY "Users can view members of their circles" ON circle_members
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can join circles (insert themselves)
CREATE POLICY "Users can join circles" ON circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave circles (update their own membership)
CREATE POLICY "Users can leave circles" ON circle_members
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- SOCIAL SIDEQUESTS POLICIES
-- ============================================================================

-- Users can view their own sidequests
CREATE POLICY "Users can view their own sidequests" ON social_sidequests
  FOR SELECT USING (created_by = auth.uid());

-- Users can view circle sidequests
CREATE POLICY "Users can view circle sidequests" ON social_sidequests
  FOR SELECT USING (
    visibility = 'circle' AND circle_id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can view public sidequests
CREATE POLICY "Users can view public sidequests" ON social_sidequests
  FOR SELECT USING (visibility = 'public');

-- Users can create sidequests
CREATE POLICY "Users can create sidequests" ON social_sidequests
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own sidequests
CREATE POLICY "Users can update their own sidequests" ON social_sidequests
  FOR UPDATE USING (auth.uid() = created_by);

-- ============================================================================
-- SIDEQUEST ACTIVITIES POLICIES
-- ============================================================================

-- Users can view activities for sidequests they have access to
CREATE POLICY "Users can view activities for accessible sidequests" ON sidequest_activities
  FOR SELECT USING (
    sidequest_id IN (
      SELECT id FROM social_sidequests 
      WHERE created_by = auth.uid() 
         OR (visibility = 'circle' AND circle_id IN (
           SELECT circle_id FROM circle_members 
           WHERE user_id = auth.uid() AND is_active = true
         ))
         OR visibility = 'public'
    )
  );

-- Users can create activities for accessible sidequests
CREATE POLICY "Users can create activities for accessible sidequests" ON sidequest_activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    sidequest_id IN (
      SELECT id FROM social_sidequests 
      WHERE created_by = auth.uid() 
         OR (visibility = 'circle' AND circle_id IN (
           SELECT circle_id FROM circle_members 
           WHERE user_id = auth.uid() AND is_active = true
         ))
    )
  );

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to automatically add creator as admin when creating a circle
CREATE OR REPLACE FUNCTION handle_new_circle()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.circle_members (circle_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

-- Trigger to automatically add creator as admin
DROP TRIGGER IF EXISTS on_circle_created ON friend_circles;
CREATE TRIGGER on_circle_created
  AFTER INSERT ON friend_circles
  FOR EACH ROW EXECUTE FUNCTION handle_new_circle();

-- Function to automatically log sidequest activities
CREATE OR REPLACE FUNCTION handle_sidequest_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.sidequest_activities (sidequest_id, user_id, activity_type, description)
    VALUES (NEW.id, NEW.created_by, 'created', 'Created sidequest: ' || NEW.title);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.sidequest_activities (sidequest_id, user_id, activity_type, description)
      VALUES (NEW.id, auth.uid(), 
        CASE 
          WHEN NEW.status = 'in_progress' THEN 'started'
          WHEN NEW.status = 'completed' THEN 'completed'
          ELSE 'updated'
        END,
        'Status changed to: ' || NEW.status
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers for sidequest activities
DROP TRIGGER IF EXISTS on_sidequest_created ON social_sidequests;
CREATE TRIGGER on_sidequest_created
  AFTER INSERT ON social_sidequests
  FOR EACH ROW EXECUTE FUNCTION handle_sidequest_activity();

DROP TRIGGER IF EXISTS on_sidequest_updated ON social_sidequests;
CREATE TRIGGER on_sidequest_updated
  AFTER UPDATE ON social_sidequests
  FOR EACH ROW EXECUTE FUNCTION handle_sidequest_activity();

-- Function to generate unique circle codes
CREATE OR REPLACE FUNCTION generate_circle_code()
RETURNS TEXT 
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character uppercase alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM friend_circles WHERE friend_circles.code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('friend_circles', 'circle_members', 'social_sidequests', 'sidequest_activities')
ORDER BY table_name;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('friend_circles', 'circle_members', 'social_sidequests', 'sidequest_activities')
ORDER BY tablename, cmd;

-- Verify triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('on_circle_created', 'on_sidequest_created', 'on_sidequest_updated')
ORDER BY trigger_name;

SELECT '🎉 Spaces database schema created successfully!' as status;

-- ============================================================================
-- RLS FIX (APPENDED): Avoid recursive policies by using SECURITY DEFINER helpers
-- ============================================================================

-- Helper: check if a user is a member of a circle (bypasses RLS safely)
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

-- Helper: check if a user is an admin of a circle (bypasses RLS safely)
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

-- Tighten permissions on helper functions
REVOKE ALL ON FUNCTION public.is_member_of_circle(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin_of_circle(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of_circle(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_of_circle(uuid, uuid) TO anon, authenticated;

-- Replace recursive policies with function-based checks
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

-- Additional non-recursive policy so creators can view their circles immediately after insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'friend_circles' AND policyname = 'Creators can view their circles'
  ) THEN
    CREATE POLICY "Creators can view their circles" ON friend_circles
      FOR SELECT USING (created_by = auth.uid());
  END IF;
END $$;
