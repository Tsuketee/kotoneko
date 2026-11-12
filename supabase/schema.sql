-- ตารางเก็บความคืบหน้าของ Kotoneko บน Supabase
-- วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์นี้ → Run (รันซ้ำได้ ไม่พัง)
-- แต่ละผู้ใช้มี 1 แถว: data = ความคืบหน้าทั้งก้อน (key เดียวกับใน localStorage), rev = เลขรุ่นไว้กันเขียนทับกัน

create table if not exists public.progress (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null,
  rev        bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint progress_data_size check (pg_column_size(data) < 2000000)  -- กันข้อมูลใหญ่ผิดปกติ (~2 MB)
);

-- Row Level Security: แต่ละคนอ่าน/เขียนได้เฉพาะแถวของตัวเอง (anon key ที่อยู่ในแอปจึงเปิดเผยได้)
alter table public.progress enable row level security;

drop policy if exists "progress_select_own" on public.progress;
drop policy if exists "progress_insert_own" on public.progress;
drop policy if exists "progress_update_own" on public.progress;
drop policy if exists "progress_delete_own" on public.progress;
create policy "progress_select_own" on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "progress_insert_own" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progress_update_own" on public.progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progress_delete_own" on public.progress for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;

-- เวลาอัปเดตตั้งโดยเซิร์ฟเวอร์ทุกครั้ง (ไม่เชื่อเวลาจากเครื่องผู้ใช้)
create or replace function public.progress_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists progress_touch on public.progress;
create trigger progress_touch before insert or update on public.progress
  for each row execute function public.progress_touch();

-- ลบบัญชีตัวเอง: แอปเรียกฟังก์ชันนี้เมื่อผู้ใช้กด "ลบบัญชี" (anon key ลบผู้ใช้เองไม่ได้ จึงต้องมีฟังก์ชันนี้)
-- ลบแถวใน auth.users ของผู้เรียกเท่านั้น (ตาม auth.uid()) ส่วนตาราง progress ถูกลบตามอัตโนมัติ (on delete cascade)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = (select auth.uid());
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
