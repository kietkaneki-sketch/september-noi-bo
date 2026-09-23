# Setup Supabase cho SEPTEMBER NỘI BỘ

Làm đúng thứ tự dưới đây, mỗi bước chỉ vài phút.

## 1. Tạo project

1. [supabase.com](https://supabase.com) → **Start your project** → đăng nhập bằng GitHub.
2. **New project** → đặt tên, tạo mật khẩu database (lưu lại chỗ an toàn), chọn region **Singapore**.
3. Đợi project khởi tạo (~2 phút).

## 2. Chạy schema

1. Trong project → **SQL Editor** → **New query**.
2. Dán toàn bộ nội dung file [`schema.sql`](./schema.sql) → **Run**.
3. Xong bước này sẽ có sẵn: bảng dữ liệu, luật bảo mật (RLS), 2 phòng ban mẫu (Sale, Marketing), 4 loại ca mẫu.

## 3. Lấy Project URL + anon key (gửi cho tôi để gắn vào app)

**Project Settings** (icon bánh răng góc dưới trái) → **API**:
- **Project URL** → dạng `https://xxxxx.supabase.co`
- **anon public** key → chuỗi dài bắt đầu `eyJ...`

Hai giá trị này an toàn để chia sẻ — chúng chỉ cho phép làm đúng những gì luật RLS trong `schema.sql` cho phép.

## 4. Deploy Edge Function `admin-create-employee`

Function này giữ "khoá toàn quyền" (service role key) ở phía server, để việc admin thêm tài khoản nhân viên mới được an toàn — khoá đó không bao giờ được đưa vào code chạy trên trình duyệt.

Chạy trong Terminal, tại thư mục gốc project này (không cần cài gì trước, `npx` sẽ tự tải):

```bash
npx supabase login
npx supabase link --project-ref <project-ref-của-bạn>
npx supabase functions deploy admin-create-employee
```

`<project-ref-của-bạn>` là đoạn `xxxxx` trong Project URL (`https://xxxxx.supabase.co`).
`supabase login` sẽ mở trình duyệt để bạn đăng nhập — bước này chỉ bạn làm được.

## 5. Tạo tài khoản admin đầu tiên (chỉ làm 1 lần)

Vì việc tạo tài khoản nhân viên khác đều phải đi qua Edge Function ở bước 4 (cần có admin gọi), riêng **admin đầu tiên** phải tạo tay:

1. Project → **Authentication → Users → Add user → Create new user**.
2. Email: `admin@september.internal` (đúng định dạng này, app tự ghép domain này phía sau tên đăng nhập).
3. Password: đặt mật khẩu cho admin, tick **Auto Confirm User**.
4. Vào **Table Editor → profiles → Insert row**, điền:
   - `id`: copy đúng UUID của user vừa tạo ở bước 2 (xem cột id trong Authentication → Users)
   - `username`: `admin`
   - `full_name`: tên bạn, vd `T — Quản trị`
   - `role`: `admin`
   - `active`: `true`
5. Xong — đăng nhập app bằng tên đăng nhập `admin` + mật khẩu vừa đặt.

Từ đây, admin dùng app để thêm toàn bộ tài khoản nhân viên khác (Nhân sự → Thêm tài khoản), không cần đụng vào Supabase Dashboard nữa.

## 6. Bật email confirmation off (khuyến nghị cho nội bộ)

Vì nhân viên dùng email nội bộ giả (`username@september.internal`), tắt bước xác nhận email để không bị kẹt tài khoản:
**Authentication → Providers → Email → tắt "Confirm email"**.
