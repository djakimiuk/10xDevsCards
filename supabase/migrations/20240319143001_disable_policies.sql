-- Migration: Disable All Policies
-- Description: Drops all previously defined RLS policies
-- Author: AI Assistant
-- Date: 2024-03-19

-- Drop policies from flashcards table
drop policy if exists "flashcards_select_policy" on flashcards;
drop policy if exists "flashcards_insert_policy" on flashcards;
drop policy if exists "flashcards_update_policy" on flashcards;
drop policy if exists "flashcards_delete_policy" on flashcards;
drop policy if exists "flashcards_service_role_policy" on flashcards;

-- Drop policies from generation_requests table
drop policy if exists "generation_requests_select_policy" on generation_requests;
drop policy if exists "generation_requests_insert_policy" on generation_requests;
drop policy if exists "generation_requests_update_policy" on generation_requests;
drop policy if exists "generation_requests_delete_policy" on generation_requests;
drop policy if exists "generation_requests_service_role_policy" on generation_requests;

-- Drop policies from ai_candidate_flashcards table
drop policy if exists "ai_candidates_select_policy" on ai_candidate_flashcards;
drop policy if exists "ai_candidates_insert_policy" on ai_candidate_flashcards;
drop policy if exists "ai_candidates_update_policy" on ai_candidate_flashcards;
drop policy if exists "ai_candidates_delete_policy" on ai_candidate_flashcards;
drop policy if exists "ai_candidates_service_role_policy" on ai_candidate_flashcards; 