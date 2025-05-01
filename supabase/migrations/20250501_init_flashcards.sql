-- Create generation_requests table (jeśli nie istnieje)
CREATE TABLE IF NOT EXISTS generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create ai_candidate_flashcards table (jeśli nie istnieje)
CREATE TABLE IF NOT EXISTS ai_candidate_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES generation_requests(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Nie tworzymy tabeli saved_flashcards ani flashcard_decks, ponieważ już istnieje tabela flashcards

-- Create RLS policies for these tables
-- generation_requests policies
ALTER TABLE generation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY generation_requests_insert_policy ON generation_requests
  FOR INSERT TO authenticated USING (true);

CREATE POLICY generation_requests_select_policy ON generation_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY generation_requests_update_policy ON generation_requests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY generation_requests_delete_policy ON generation_requests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ai_candidate_flashcards policies
ALTER TABLE ai_candidate_flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_candidate_flashcards_insert_policy ON ai_candidate_flashcards
  FOR INSERT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM generation_requests
      WHERE generation_requests.id = ai_candidate_flashcards.request_id
      AND generation_requests.user_id = auth.uid()
    )
  );

CREATE POLICY ai_candidate_flashcards_select_policy ON ai_candidate_flashcards
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM generation_requests
      WHERE generation_requests.id = ai_candidate_flashcards.request_id
      AND generation_requests.user_id = auth.uid()
    )
  );

CREATE POLICY ai_candidate_flashcards_update_policy ON ai_candidate_flashcards
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM generation_requests
      WHERE generation_requests.id = ai_candidate_flashcards.request_id
      AND generation_requests.user_id = auth.uid()
    )
  );

CREATE POLICY ai_candidate_flashcards_delete_policy ON ai_candidate_flashcards
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM generation_requests
      WHERE generation_requests.id = ai_candidate_flashcards.request_id
      AND generation_requests.user_id = auth.uid()
    )
  );

-- flashcards policies (dla istniejącej tabeli)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flashcards' AND policyname = 'flashcards_insert_policy'
  ) THEN
    ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

    CREATE POLICY flashcards_insert_policy ON flashcards
      FOR INSERT TO authenticated USING (auth.uid() = user_id);

    CREATE POLICY flashcards_select_policy ON flashcards
      FOR SELECT TO authenticated USING (auth.uid() = user_id);

    CREATE POLICY flashcards_update_policy ON flashcards
      FOR UPDATE TO authenticated USING (auth.uid() = user_id);

    CREATE POLICY flashcards_delete_policy ON flashcards
      FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END
$$; 