# SEPTEMBER NỘI BỘ

App quản lý lịch làm việc, đơn nghỉ / remote và hồ sơ nhân sự cho September Studio
(hiện tại: phòng Sale &amp; Marketing).

Logo dùng đúng file gốc của studio (`public/brand/september-logo.png`, nền trong suốt, tự đảo màu ở dark mode) — không tái tạo bằng font. Font chữ toàn app: **Plus Jakarta Sans**.

Quyền quản trị (admin) ngoài duyệt đơn/thêm tài khoản còn có ở **Cài đặt**:
- Thêm/sửa/xoá **loại ca làm** (tên, khung giờ mặc định, màu riêng) — nhân viên chọn từ danh sách này khi đăng ký ca.
- Thêm/đổi tên/xoá **phòng ban** (đổi tên tự cập nhật cho toàn bộ nhân viên đang thuộc phòng đó).
- Đăng **thông báo nội bộ**, hiển thị ngay trên Tổng quan cho mọi người.

## Backend: Supabase (database thật, dùng chung cho mọi người)

Dữ liệu (tài khoản, ca làm, đơn từ, lương/hợp đồng) nằm trên **Supabase** (Postgres + Auth thật), không phải trong trình duyệt — mọi người trên mọi thiết bị đều thấy chung một dữ liệu, cập nhật gần như tức thời (Realtime), và có backup tự động phía server.

Xem [`supabase/README.md`](supabase/README.md) để setup lần đầu: chạy schema, deploy Edge Function tạo tài khoản, tạo admin đầu tiên.

Sau khi có **Project URL** và **anon key** từ Supabase, tạo file `.env` ở gốc project (copy từ `.env.example`):

```bash
cp .env.example .env
```

rồi điền 2 giá trị đó vào. File `.env` đã được `.gitignore` — không bao giờ commit lên GitHub.

## Chạy thử trên máy

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`, đăng nhập bằng tài khoản admin đã tạo ở bước Supabase.

## Bảo mật dữ liệu nhạy cảm (CCCD, lương, hợp đồng)

Thông tin cá nhân/hợp đồng chỉ admin xem/sửa được (luật RLS ở `supabase/schema.sql` chặn thẳng ở tầng database, không chỉ ẩn trên giao diện). Nhân viên nhìn thấy nhau qua một "danh bạ" chỉ gồm tên/phòng ban/chức danh/liên hệ — không bao giờ thấy lương hay CCCD của người khác, kể cả khi họ tự mở DevTools truy vấn thẳng API.

## Deploy lên Netlify

```bash
npm run build
```

Repo này nối với Netlify qua GitHub để mỗi lần cập nhật code là tự động lên bản mới (continuous deployment):

- Build command: `npm run build`
- Publish directory: `dist`
- **Environment variables** (Site settings → Environment variables) — bắt buộc phải thêm, nếu không app sẽ không kết nối được Supabase khi chạy trên Netlify:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

File `netlify.toml` đã cấu hình sẵn build command, publish directory, và rule redirect cho SPA (để tải lại trang ở `/schedule`, `/requests`... không bị lỗi 404).

## Cấu trúc chính

- `supabase/schema.sql` — toàn bộ bảng dữ liệu + luật bảo mật (RLS).
- `supabase/functions/admin-create-employee` — Edge Function xử lý việc admin tạo tài khoản mới (giữ service role key an toàn phía server).
- `src/lib/supabaseClient.js` — kết nối Supabase (đọc key từ biến môi trường).
- `src/lib/store.js` — toàn bộ hàm đọc/ghi dữ liệu qua Supabase, trả về đúng hình dạng object mà giao diện cần.
- `src/context/AppContext.jsx` — quản lý phiên đăng nhập, tải dữ liệu, và lắng nghe Realtime để tự cập nhật khi có người khác thao tác.
- `src/pages/` — các màn hình: Dashboard, Schedule, Requests, Employees, EmployeeDetail (hồ sơ + lương/hợp đồng), Settings.
