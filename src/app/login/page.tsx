import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Brain, Lock } from 'lucide-react'
import { headers } from 'next/headers'
import { FormMessageToast } from '@/components/FormMessageToast'
import { db } from '@/utils/db';

export const instant = false;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;

  const signIn = async (formData: FormData) => {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    // Determine role and redirect
    let role = 'STUDENT';
    try {
      const user = signInData?.user;
      if (user) {
        const pool = db;
        const res = await pool.query("SELECT role FROM user_roles WHERE user_id = $1", [user.id]);
        if (res.rows.length > 0) role = res.rows[0].role;
      }
    } catch (err) {
      console.error("Role lookup error during login:", err);
    }

    if (role === 'SUPER_ADMIN' || role === 'CONTENT_ADMIN') {
      return redirect('/admin');
    }
    return redirect('/dashboard');
  }

  const signInWithGoogle = async () => {
    'use server'
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || "http://localhost:3000"
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) return redirect(`/login?message=${encodeURIComponent(error.message)}`)
    if (data.url) redirect(data.url)
  }

  const signInWithGithub = async () => {
    'use server'
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || "http://localhost:3000"
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) return redirect(`/login?message=${encodeURIComponent(error.message)}`)
    if (data.url) redirect(data.url)
  }

  const signInWithFacebook = async () => {
    'use server'
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || "http://localhost:3000"
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) return redirect(`/login?message=${encodeURIComponent(error.message)}`)
    if (data.url) redirect(data.url)
  }

  const signInWithLinkedin = async () => {
    'use server'
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || "http://localhost:3000"
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) return redirect(`/login?message=${encodeURIComponent(error.message)}`)
    if (data.url) redirect(data.url)
  }

  const signInWithAzure = async () => {
    'use server'
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || "http://localhost:3000"
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) return redirect(`/login?message=${encodeURIComponent(error.message)}`)
    if (data.url) redirect(data.url)
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <img src="/crackpyq-logo.png" alt="CrackPYQ" className="h-16 w-auto mb-6 object-contain" />
        <h2 className="text-center text-3xl font-extrabold text-white">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Or <Link href="/signup" className="font-medium text-purple-400 hover:text-purple-300">create a new student account</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111624] py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-white/10">
          <form className="space-y-6" action={signIn}>
            <FormMessageToast />
            <div>
              <label className="block text-sm font-medium text-gray-300">Email address</label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  required
                  className="bg-[#0B0F19] text-white appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <div className="mt-1">
                <input
                  name="password"
                  type="password"
                  required
                  className="bg-[#0B0F19] text-white appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Lock size={18} className="mr-2" /> Sign in
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#111624] text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-3"><form action={signInWithGithub}><button title="Sign in with GitHub" type="submit" className="w-full inline-flex justify-center py-2.5 px-4 border border-white/10 rounded-lg shadow-sm bg-[#111624] text-sm font-medium hover:bg-[#0B0F19] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"><svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" /></svg></button></form><form action={signInWithFacebook}><button title="Sign in with Facebook" type="submit" className="w-full inline-flex justify-center py-2.5 px-4 border border-white/10 rounded-lg shadow-sm bg-[#111624] text-sm font-medium hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"><svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg></button></form><form action={signInWithLinkedin}><button title="Sign in with LinkedIn" type="submit" className="w-full inline-flex justify-center py-2.5 px-4 border border-white/10 rounded-lg shadow-sm bg-[#111624] text-sm font-medium hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 transition-colors"><svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></button></form><form action={signInWithAzure}><button title="Sign in with Microsoft" type="submit" className="w-full inline-flex justify-center py-2.5 px-4 border border-white/10 rounded-lg shadow-sm bg-[#111624] text-sm font-medium hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f35325] transition-colors"><svg className="w-5 h-5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg></button></form></div>
          </div>
        </div>
      </div>
    </div>
  )
}


