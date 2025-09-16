-- Optimization for circle code search performance

-- 1. Add index on code column for O(log n) lookups
CREATE INDEX IF NOT EXISTS idx_friend_circles_code ON friend_circles(code);

-- 2. Add index on code + is_active for even faster active circle lookups
CREATE INDEX IF NOT EXISTS idx_friend_circles_code_active ON friend_circles(code, is_active) WHERE is_active = true;

-- 3. Add index for code uniqueness validation during creation
CREATE INDEX IF NOT EXISTS idx_friend_circles_code_unique ON friend_circles(code) WHERE is_active = true;

-- 4. Analyze the table to update statistics for query planner
ANALYZE friend_circles;
