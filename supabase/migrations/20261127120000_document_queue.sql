-- Free accounts past their free document can still upload: the document waits as "queued" and starts when the
-- account's next free reel is allowed (see src/lib/queue.ts). `queued` marks it so the upload's start step parks
-- it instead of processing it.
alter table public.documents add column if not exists queued boolean not null default false;
alter table public.documents drop constraint if exists documents_status_check;
alter table public.documents add constraint documents_status_check
  check (status = any (array['uploading','uploaded','extracting','planning','scripting','ready','failed','queued']));
create index if not exists documents_queued_idx on public.documents (user_id, created_at) where status = 'queued';
