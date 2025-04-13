-- Enable RLS
alter table public.flashcards enable row level security;

-- Policy for inserting flashcards (allow all for now, since we're using a default user)
create policy "Enable insert for all users"
    on public.flashcards
    for insert
    with check (true);  -- Allow all inserts

-- Policy for selecting flashcards (users can see their own flashcards)
create policy "Enable read access for all users"
    on public.flashcards
    for select
    using (true);  -- Allow all reads for now

-- Policy for updating flashcards (users can update their own flashcards)
create policy "Enable update for users based on user_id"
    on public.flashcards
    for update
    using (true)  -- Allow all updates for now
    with check (true);

-- Policy for deleting flashcards (users can delete their own flashcards)
create policy "Enable delete for users based on user_id"
    on public.flashcards
    for delete
    using (true);  -- Allow all deletes for now 