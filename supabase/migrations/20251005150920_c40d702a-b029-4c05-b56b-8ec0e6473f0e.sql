-- Create public avatars bucket if not exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policies for avatars bucket
-- Allow public read (both anon and authenticated)
create policy "Public read access to avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow authenticated users to upload to avatars
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

-- Allow owners to update their own avatar files
create policy "Owners can update their avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and auth.uid() = owner::uuid);

-- Allow owners to delete their own avatar files
create policy "Owners can delete their avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and auth.uid() = owner::uuid);