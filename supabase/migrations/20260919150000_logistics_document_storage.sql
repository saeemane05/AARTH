-- Vehicle documents are private partner records. The API uses the service key,
-- while these policies keep direct authenticated access owner-scoped as well.
insert into storage.buckets (id, name, public)
values ('logistics-documents', 'logistics-documents', false)
on conflict (id) do nothing;

drop policy if exists "Logistics partners manage their own vehicle documents" on storage.objects;
create policy "Logistics partners manage their own vehicle documents"
on storage.objects for all to authenticated
using (
  bucket_id = 'logistics-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'logistics-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
