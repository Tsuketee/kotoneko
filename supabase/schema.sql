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

-- ===== เนื้อหาเสียเงิน (N4 …) =====
-- admins: ผู้ดูแลที่อัปโหลดแพ็กเนื้อหาได้ (เพิ่มเองใน SQL Editor เท่านั้น ไม่มีสิทธิ์จากฝั่งแอป)
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;   -- ไม่มี policy = แอปอ่าน/เขียนตรงไม่ได้ ใช้ผ่าน is_admin() เท่านั้น
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- entitlements: ใครปลดล็อกระดับไหนแล้ว · ผู้ใช้อ่านได้เฉพาะของตัวเอง เพิ่ม/ลบได้จาก SQL Editor หรือฝั่งเซิร์ฟเวอร์ (webhook ชำระเงิน) เท่านั้น
create table if not exists public.entitlements (
  user_id    uuid not null references auth.users (id) on delete cascade,
  level      text not null check (level ~ '^n[1-4]$'),
  source     text not null default 'manual',   -- manual / stripe
  created_at timestamptz not null default now(),
  primary key (user_id, level)
);
alter table public.entitlements enable row level security;
drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own" on public.entitlements for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));
revoke all on public.entitlements from anon, authenticated;
grant select on public.entitlements to authenticated;

-- content_packs: แพ็กเนื้อหาแต่ละระดับ (ไฟล์ packs/<ระดับ>.json จาก repo เนื้อหาแบบ private)
-- อ่านได้เฉพาะผู้มีสิทธิ์ระดับนั้น หรือผู้ดูแล · เขียนได้เฉพาะผู้ดูแล
create table if not exists public.content_packs (
  level      text primary key check (level ~ '^n[1-4]$'),
  version    bigint not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint content_packs_size check (pg_column_size(data) < 5000000)
);
alter table public.content_packs enable row level security;
drop policy if exists "content_packs_select_entitled" on public.content_packs;
drop policy if exists "content_packs_insert_admin" on public.content_packs;
drop policy if exists "content_packs_update_admin" on public.content_packs;
drop policy if exists "content_packs_delete_admin" on public.content_packs;
create policy "content_packs_select_entitled" on public.content_packs for select to authenticated
  using ((select public.is_admin()) or exists (
    select 1 from public.entitlements e where e.user_id = (select auth.uid()) and e.level = content_packs.level));
create policy "content_packs_insert_admin" on public.content_packs for insert to authenticated with check ((select public.is_admin()));
create policy "content_packs_update_admin" on public.content_packs for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "content_packs_delete_admin" on public.content_packs for delete to authenticated using ((select public.is_admin()));
revoke all on public.content_packs from anon, authenticated;
grant select, insert, update, delete on public.content_packs to authenticated;

drop trigger if exists content_packs_touch on public.content_packs;
create trigger content_packs_touch before insert or update on public.content_packs
  for each row execute function public.progress_touch();

-- ===== การชำระเงิน (Stripe) =====
-- purchases: บันทึกการซื้อจาก Stripe Checkout (เขียนโดย Edge Function stripe-webhook ด้วย service role เท่านั้น ดู docs/PAYMENT.md)
-- ใช้หาว่าการคืนเงิน (charge.refunded) เป็นของใคร ระดับไหน · แอปอ่าน/เขียนตารางนี้ไม่ได้เลย (ไม่มี policy)
create table if not exists public.purchases (
  session_id     text primary key,                                           -- cs_… ของ Stripe
  user_id        uuid references auth.users (id) on delete set null,         -- ลบบัญชีแล้วยังเก็บประวัติการเงินไว้
  level          text not null check (level ~ '^n[1-4]$'),
  status         text not null,                                              -- paid / pending / failed / refunded / paid_no_user
  payment_intent text,
  amount         bigint,                                                     -- หน่วยย่อยของสกุลเงิน (สตางค์)
  currency       text,
  livemode       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists purchases_payment_intent on public.purchases (payment_intent);
alter table public.purchases enable row level security;
revoke all on public.purchases from anon, authenticated;

drop trigger if exists purchases_touch on public.purchases;
create trigger purchases_touch before update on public.purchases
  for each row execute function public.progress_touch();
