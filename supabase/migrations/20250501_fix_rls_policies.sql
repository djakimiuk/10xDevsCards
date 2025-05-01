-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS generation_requests_insert_policy ON generation_requests;
DROP POLICY IF EXISTS ai_candidate_flashcards_insert_policy ON ai_candidate_flashcards;

-- Create simpler insert policies with default behavior
CREATE POLICY generation_requests_insert_policy ON generation_requests
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY ai_candidate_flashcards_insert_policy ON ai_candidate_flashcards
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enable row-level security if not already enabled
ALTER TABLE generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_candidate_flashcards ENABLE ROW LEVEL SECURITY; 