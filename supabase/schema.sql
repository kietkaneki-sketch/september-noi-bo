-- SEPTEMBER NỘI BỘ — schema + RLS cho Supabase
-- Cách dùng: Supabase Dashboard → SQL Editor → New query → dán toàn bộ file này → Run.
-- An toàn để chạy lại nhiều lần (dùng IF NOT EXISTS / OR REPLACE ở những chỗ hợp lý),
-- nhưng KHÔNG chạy lại sau khi đã có dữ liệu thật, vì phần seed ở cuối sẽ chèn lại mẫu.

-- ============ TABLES ============

create table if not exists public.departments (
  name text primary key
);

create table if not exists public.shift_types (
  id text primary key,
  label text not null,
  start_time text not null default '08:00',
  end_time text not null default '17:00',
  color text not null default '#a37a34'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role text not null default 'employee' check (role in ('admin','employee')),
  department text references public.departments(name) on update cascade,
  position text default '',
  phone text default '',
  email text default '',
  active boolean not null default true,
  avatar_color text default '#a37a34',
  personal_info jsonb not null default '{}'::jsonb,
  contract jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  shift_type text not null references public.shift_types(id),
  start_time text not null,
  end_time text not null,
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('off','remote')),
  date_from date not null,
  date_to date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  review_note text default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text default '',
  created_by uuid references public.profiles(id),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ HELPER ============

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============ RLS ============

alter table public.departments enable row level security;
alter table public.shift_types enable row level security;
alter table public.profiles enable row level security;
alter table public.shifts enable row level security;
alter table public.requests enable row level security;
alter table public.announcements enable row level security;

drop policy if exists "departments_select" on public.departments;
create policy "departments_select" on public.departments for select using (auth.role() = 'authenticated');
drop policy if exists "departments_write" on public.departments;
create policy "departments_write" on public.departments for all using (is_admin()) with check (is_admin());

drop policy if exists "shift_types_select" on public.shift_types;
create policy "shift_types_select" on public.shift_types for select using (auth.role() = 'authenticated');
drop policy if exists "shift_types_write" on public.shift_types;
create policy "shift_types_write" on public.shift_types for all using (is_admin()) with check (is_admin());

-- Chỉ CHÍNH CHỦ hoặc admin mới đọc được bảng profiles gốc (có personal_info/contract = CCCD, lương...).
-- Danh sách "ai đang làm phòng nào" cho toàn team xem thì dùng view team_directory bên dưới,
-- KHÔNG lộ personal_info/contract của người khác.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (id = auth.uid() or is_admin());
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (is_admin()) with check (is_admin());
-- Không có policy insert/delete cho profiles: chỉ tạo được qua Edge Function (service role).

-- View công khai cho toàn team: chỉ các cột không nhạy cảm (không có personal_info/contract).
-- View chạy với quyền của chủ view (postgres), nên vẫn đọc được dù RLS ở bảng gốc đã khoá chặt.
create or replace view public.team_directory
with (security_invoker = false) as
  select id, username, full_name, role, department, position, phone, email, active, avatar_color, created_at
  from public.profiles;

grant select on public.team_directory to authenticated;

drop policy if exists "shifts_select" on public.shifts;
create policy "shifts_select" on public.shifts for select using (auth.role() = 'authenticated');
drop policy if exists "shifts_insert" on public.shifts;
create policy "shifts_insert" on public.shifts for insert with check (user_id = auth.uid() or is_admin());
drop policy if exists "shifts_delete" on public.shifts;
create policy "shifts_delete" on public.shifts for delete using (user_id = auth.uid() or is_admin());

drop policy if exists "requests_select" on public.requests;
create policy "requests_select" on public.requests for select using (user_id = auth.uid() or is_admin());
drop policy if exists "requests_insert" on public.requests;
create policy "requests_insert" on public.requests for insert with check (user_id = auth.uid());
drop policy if exists "requests_update" on public.requests;
create policy "requests_update" on public.requests for update using (is_admin()) with check (is_admin());

drop policy if exists "announcements_select" on public.announcements;
create policy "announcements_select" on public.announcements for select using (auth.role() = 'authenticated');
drop policy if exists "announcements_write" on public.announcements;
create policy "announcements_write" on public.announcements for all using (is_admin()) with check (is_admin());

-- ============ REALTIME ============
-- Cho phép app tự cập nhật ngay khi có người khác đăng ký ca / gửi đơn, không cần bấm refresh.
alter publication supabase_realtime add table public.shifts, public.requests, public.announcements, public.profiles;

-- ============ SEED (chỉ chạy 1 lần lúc mới tạo project) ============

insert into public.departments (name) values ('Sale'), ('Marketing')
  on conflict (name) do nothing;

insert into public.shift_types (id, label, start_time, end_time, color) values
  ('morning', 'Ca sáng', '08:00', '12:00', '#b6893f'),
  ('afternoon', 'Ca chiều', '13:00', '17:30', '#5b7a9a'),
  ('full_day', 'Cả ngày', '08:00', '17:30', '#7c5cbf'),
  ('custom', 'Giờ tùy chỉnh', '08:00', '17:00', '#8a9a5b')
  on conflict (id) do nothing;

-- Lưu ý: KHÔNG seed sẵn tài khoản admin ở đây vì auth.users phải tạo qua Supabase Auth
-- (không thể insert thẳng bằng SQL an toàn). Xem supabase/README.md để tạo tài khoản admin đầu tiên.
