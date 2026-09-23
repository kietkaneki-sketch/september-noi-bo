// Edge Function: admin-create-employee
//
// Tại sao cần function riêng thay vì gọi thẳng từ frontend: tạo tài khoản đăng nhập mới
// (auth.users) đòi hỏi "service role key" — khoá toàn quyền, tuyệt đối không được đưa vào
// code chạy trên trình duyệt. Function này chạy trên server của Supabase, giữ khoá đó an
// toàn, và tự kiểm tra người gọi có đúng là admin (role='admin' trong bảng profiles) không
// trước khi cho tạo tài khoản.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client "đứng tên" người gọi, chỉ để xác minh họ là ai.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) {
      return json({ error: 'Chưa đăng nhập.' }, 401)
    }

    // Client toàn quyền, chỉ dùng phía server để kiểm tra quyền + tạo tài khoản.
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Chỉ quản trị viên mới được thêm tài khoản.' }, 403)
    }

    const body = await req.json()
    const { username, password, fullName, department, position, phone, email, avatarColor } = body

    if (!username || !fullName || !department) {
      return json({ error: 'Thiếu tên đăng nhập, họ tên hoặc phòng ban.' }, 400)
    }

    const authEmail = `${String(username).trim().toLowerCase()}@september.internal`

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: authEmail,
      password: password || '123456',
      email_confirm: true,
    })

    if (createError) {
      const msg = createError.message.includes('already been registered')
        ? 'Tên đăng nhập đã tồn tại.'
        : createError.message
      return json({ error: msg }, 400)
    }

    const { error: profileError } = await admin.from('profiles').insert({
      id: created.user.id,
      username: String(username).trim().toLowerCase(),
      full_name: fullName,
      role: 'employee',
      department,
      position: position || '',
      phone: phone || '',
      email: email || '',
      active: true,
      avatar_color: avatarColor || '#a37a34',
    })

    if (profileError) {
      // rollback: xoá auth user vừa tạo để không kẹt tài khoản mồ côi
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: profileError.message }, 400)
    }

    return json({ ok: true, id: created.user.id }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Lỗi không xác định.' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
