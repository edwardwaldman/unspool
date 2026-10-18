-- How many reels the planner chose for a document (3–15, by content). Null until the plan exists.
-- Additive only: no drops. Existing documents get their current number of reel rows.
alter table public.documents add column if not exists reel_count int;

update public.documents d
set reel_count = r.n
from (select document_id, count(*)::int as n from public.reels group by document_id) r
where r.document_id = d.id and d.reel_count is null;
