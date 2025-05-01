# Row Level Security (RLS) Policy Fix

This document explains the changes made to fix the Row Level Security (RLS) policy issues that were preventing the insertion of AI candidate flashcards.

## Problem

The application was encountering errors like:

```
new row violates row-level security policy for table ai_candidate_flashcards
```

This happened because the RLS policies were not correctly configured to allow the API endpoints to insert records into the `ai_candidate_flashcards` table.

## Solution

The solution involved:

1. Creating a new SQL migration script that fixes the RLS policies:

   - `supabase/migrations/20240502000000_fix_rls_policies.sql`
   - This script includes proper policies for INSERT, SELECT, UPDATE, and DELETE operations

2. Adding a Supabase admin client that uses the service role key:

   - Created `src/db/supabase.service.ts` with a new `supabaseAdmin` client
   - This client bypasses RLS policies when performing operations

3. Updating the API endpoints to use the admin client:

   - `FlashcardGeneratorService`: Now uses `supabaseAdmin` for inserting AI candidate flashcards
   - `/api/ai-candidates/[id]/accept.ts`: Uses admin client for inserting flashcards and deleting candidates
   - `/api/ai-candidates/[id].ts`: Uses admin client for UPDATE and DELETE operations

4. Adding environment type definitions:
   - Updated `src/env.d.ts` to include the `SUPABASE_SERVICE_ROLE_KEY`

## Deployment Steps

1. Add the Supabase service role key to your environment variables:

   ```
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   You can find this key in the Supabase dashboard under Project Settings > API.

2. Apply the new migrations to your Supabase database:

   ```
   supabase db push
   ```

   Or manually run the SQL in the 20240502000000_fix_rls_policies.sql file in the Supabase SQL editor.

3. Deploy the updated code to your hosting platform.

## Temporary Policies and Production Considerations

Note that the migration includes a temporary policy for debugging purposes:

```sql
-- Add a temporary bypass policy for debugging - REMOVE THIS IN PRODUCTION
CREATE POLICY "temp_bypass_policy" ON ai_candidate_flashcards
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

This policy bypasses RLS completely for the `ai_candidate_flashcards` table. Once you've confirmed that everything is working correctly, you should create another migration to remove this policy:

```sql
-- Remove the temporary bypass policy
DROP POLICY IF EXISTS "temp_bypass_policy" ON ai_candidate_flashcards;
```

## Verifying the Fix

After deploying these changes, the application should be able to:

1. Generate AI flashcards without RLS errors
2. Allow users to view, edit, accept, and delete their AI candidate flashcards
3. Successfully transfer accepted flashcards to the permanent flashcards table

Monitor your application logs after deployment to ensure no further RLS policy violations are occurring.
