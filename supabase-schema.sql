-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create friend_circles table
CREATE TABLE IF NOT EXISTS friend_circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 50
);

-- Create circle_members table
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES friend_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(circle_id, user_id)
);

-- Create social_sidequests table
CREATE TABLE IF NOT EXISTS social_sidequests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES friend_circles(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'circle', 'public')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create sidequest_activities table
CREATE TABLE IF NOT EXISTS sidequest_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sidequest_id UUID NOT NULL REFERENCES social_sidequests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'started', 'updated', 'completed', 'commented')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friend_circles_code ON friend_circles(code);
CREATE INDEX IF NOT EXISTS idx_friend_circles_created_by ON friend_circles(created_by);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_social_sidequests_created_by ON social_sidequests(created_by);
CREATE INDEX IF NOT EXISTS idx_social_sidequests_circle_id ON social_sidequests(circle_id);
CREATE INDEX IF NOT EXISTS idx_social_sidequests_status ON social_sidequests(status);
CREATE INDEX IF NOT EXISTS idx_sidequest_activities_sidequest_id ON sidequest_activities(sidequest_id);
CREATE INDEX IF NOT EXISTS idx_sidequest_activities_user_id ON sidequest_activities(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_sidequests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidequest_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for friend_circles table
CREATE POLICY "Users can view circles they're members of" ON friend_circles
  FOR SELECT USING (
    id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create circles" ON friend_circles
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle admins can update circles" ON friend_circles
  FOR UPDATE USING (
    id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- RLS Policies for circle_members table
CREATE POLICY "Users can view members of their circles" ON circle_members
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can join circles" ON circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave circles" ON circle_members
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for social_sidequests table
CREATE POLICY "Users can view their own sidequests" ON social_sidequests
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view circle sidequests" ON social_sidequests
  FOR SELECT USING (
    visibility = 'circle' AND circle_id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view public sidequests" ON social_sidequests
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can create sidequests" ON social_sidequests
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own sidequests" ON social_sidequests
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for sidequest_activities table
CREATE POLICY "Users can view activities for sidequests they have access to" ON sidequest_activities
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

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to automatically add creator as admin when creating a circle
CREATE OR REPLACE FUNCTION handle_new_circle()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO circle_members (circle_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add creator as admin
DROP TRIGGER IF EXISTS on_circle_created ON friend_circles;
CREATE TRIGGER on_circle_created
  AFTER INSERT ON friend_circles
  FOR EACH ROW EXECUTE FUNCTION handle_new_circle();

-- Function to automatically log sidequest activities
CREATE OR REPLACE FUNCTION handle_sidequest_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO sidequest_activities (sidequest_id, user_id, activity_type, description)
    VALUES (NEW.id, NEW.created_by, 'created', 'Created sidequest: ' || NEW.title);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO sidequest_activities (sidequest_id, user_id, activity_type, description)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql; 