// Edge Function: admin-reset-password
//
// Passwords are one-way hashed (bcrypt) — nobody, not even an admin, can ever look up
// what a forgotten password was. This is the correct, safe response to "quên mật khẩu":
// an admin sets a brand-new one for the employee. Same pattern as admin-create-employee —
// runs server-side so the service role key never reaches the browser, and checks the
// caller is really an admin before doing anything.

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

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) {
      return json({ error: 'Chưa đăng nhập.' }, 401)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Chỉ quản trị viên mới được đặt lại mật khẩu.' }, 403)
    }

    const { userId, newPassword } = await req.json()
    if (!userId || !newPassword || String(newPassword).length < 6) {
      return json({ error: 'Mật khẩu mới cần ít nhất 6 ký tự.' }, 400)
    }

    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) return json({ error: error.message }, 400)

    return json({ ok: true }, 200)
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
