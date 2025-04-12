-- Migration: Initial Schema Setup
-- Description: Creates the initial database schema for AI Flashcard Generator MVP
-- Tables: flashcards, generation_requests, ai_candidate_flashcards
-- Author: AI Assistant
-- Date: 2024-03-19

-- [ 1. Extensions and Dependencies ]
create extension if not exists pgcrypto;

-- [ 2. Helper Functions ]
drop function if exists handle_updated_at cascade;
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- [ 3. Clean up existing objects (if any) ]
drop table if exists ai_candidate_flashcards cascade;
drop table if exists generation_requests cascade;
drop table if exists flashcards cascade;

-- [ 4. Base Tables ]

-- Flashcards table and its components
create table flashcards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    front text not null check (char_length(front) <= 200),
    back text not null check (char_length(back) <= 500),
    source text not null check (source in ('AI', 'MANUAL')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_flashcards_user_id on flashcards(user_id);

create trigger tr_flashcards_updated_at
    before update on flashcards
    for each row execute procedure handle_updated_at();

alter table flashcards enable row level security;

create policy "flashcards_select_policy" on flashcards 
    for select using (auth.uid() = user_id);

create policy "flashcards_insert_policy" on flashcards 
    for insert with check (auth.uid() = user_id);

create policy "flashcards_update_policy" on flashcards 
    for update using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "flashcards_delete_policy" on flashcards 
    for delete using (auth.uid() = user_id);

create policy "flashcards_service_role_policy" on flashcards 
    for all using (auth.role() = 'service_role');

-- Generation requests table and its components
create table generation_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    source_text text not null check (char_length(source_text) between 1000 and 10000),
    status text not null check (status in ('processing', 'completed', 'failed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_generation_requests_user_id on generation_requests(user_id);

create trigger tr_generation_requests_updated_at
    before update on generation_requests
    for each row execute procedure handle_updated_at();

alter table generation_requests enable row level security;

create policy "generation_requests_select_policy" on generation_requests 
    for select using (auth.uid() = user_id);

create policy "generation_requests_insert_policy" on generation_requests 
    for insert with check (auth.uid() = user_id);

create policy "generation_requests_update_policy" on generation_requests 
    for update using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "generation_requests_delete_policy" on generation_requests 
    for delete using (auth.uid() = user_id);

create policy "generation_requests_service_role_policy" on generation_requests 
    for all using (auth.role() = 'service_role');

-- AI candidate flashcards table and its components
create table ai_candidate_flashcards (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null references generation_requests(id) on delete cascade,
    front text not null check (char_length(front) <= 200),
    back text not null check (char_length(back) <= 500),
    created_at timestamptz not null default now()
);

create index idx_ai_candidate_flashcards_request_id on ai_candidate_flashcards(request_id);

alter table ai_candidate_flashcards enable row level security;

create policy "ai_candidates_select_policy" on ai_candidate_flashcards 
    for select using (
        exists (
            select 1 from generation_requests gr
            where gr.id = ai_candidate_flashcards.request_id 
            and gr.user_id = auth.uid()
        )
    );

create policy "ai_candidates_insert_policy" on ai_candidate_flashcards 
    for insert with check (auth.role() = 'service_role');

create policy "ai_candidates_update_policy" on ai_candidate_flashcards 
    for update using (
        exists (
            select 1 from generation_requests gr
            where gr.id = ai_candidate_flashcards.request_id 
            and gr.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from generation_requests gr
            where gr.id = ai_candidate_flashcards.request_id 
            and gr.user_id = auth.uid()
        )
    );

create policy "ai_candidates_delete_policy" on ai_candidate_flashcards 
    for delete using (
        auth.role() = 'service_role' or
        exists (
            select 1 from generation_requests gr
            where gr.id = ai_candidate_flashcards.request_id 
            and gr.user_id = auth.uid()
        )
    );

create policy "ai_candidates_service_role_policy" on ai_candidate_flashcards 
    for all using (auth.role() = 'service_role'); 