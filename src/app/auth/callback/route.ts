import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/utils/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Create student role if they don't have one
      const pool = db;
      await pool.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'STUDENT') ON CONFLICT DO NOTHING", [data.user.id]);
      
      // Determine if they are an admin to redirect properly
      const res = await pool.query("SELECT role FROM user_roles WHERE user_id = $1", [data.user.id]);
      let role = 'STUDENT';
      if (res.rows.length > 0) role = res.rows[0].role;
      
      if (role === 'SUPER_ADMIN' || role === 'CONTENT_ADMIN') {
        return NextResponse.redirect(`${origin}/admin`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?message=Could not authenticate with provider`)
}
