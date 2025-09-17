-- Function to delete a space and clean up related data
CREATE OR REPLACE FUNCTION delete_space(
  space_id UUID,
  user_id UUID DEFAULT auth.uid()
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  space_record friend_circles;
BEGIN
  -- Check if space exists and user is the owner
  SELECT * INTO space_record
  FROM friend_circles
  WHERE id = space_id AND created_by = user_id;
  
  IF space_record IS NULL THEN
    RAISE EXCEPTION 'Space not found or you do not have permission to delete it';
  END IF;

  -- Start transaction
  BEGIN
    -- 1. Deactivate all member relationships
    UPDATE circle_members
    SET is_active = false
    WHERE circle_id = space_id;

    -- 2. Remove all sidequest links from the space
    UPDATE friend_circles
    SET sidequest_ids = array[]::uuid[]
    WHERE id = space_id;

    -- 3. Delete the space (mark as inactive)
    UPDATE friend_circles
    SET is_active = false
    WHERE id = space_id AND created_by = user_id;

    -- 4. Delete display picture from storage if exists
    -- Note: This will be handled by the client since we can't access storage from SQL
  END;
END;
$$;

-- Add RLS policy to allow space deletion
CREATE POLICY "Users can delete their own spaces"
ON friend_circles
FOR DELETE
USING (auth.uid() = created_by);

-- Add RLS policy to allow space updates (for marking as inactive)
CREATE POLICY "Users can update their own spaces"
ON friend_circles
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);
