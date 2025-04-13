-- Enable RLS
alter table generation_requests enable row level security;

-- Policy for inserting records (allow all during development)
create policy "Enable insert for all users during development"
on generation_requests for insert
to authenticated, anon
with check (true);

-- Policy for selecting own records
create policy "Enable read access for all users during development"
on generation_requests for select
to authenticated, anon
using (true); 