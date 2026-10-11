import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { User, Shield, Bell, Moon } from 'lucide-react'

export const instant = false;

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
        <p className="text-gray-400 mt-1">Manage your profile, preferences, and security.</p>
      </header>

      <div className="space-y-6">
        
        {/* Profile Details */}
        <section className="bg-[#111624] p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 text-purple-400 mb-6">
            <User size={20} />
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
          </div>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
              <input 
                type="text" 
                disabled
                value={user.email || ''} 
                className="w-full bg-[#0B0F19] text-gray-500 border border-white/5 rounded-lg px-4 py-2 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Your email cannot be changed as it is used for login.</p>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-[#111624] p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 text-emerald-400 mb-6">
            <Shield size={20} />
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>
          
          <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors border border-white/10">
            Reset Password
          </button>
        </section>

        {/* Preferences */}
        <section className="bg-[#111624] p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 text-blue-400 mb-6">
            <Moon size={20} />
            <h2 className="text-xl font-semibold text-white">Preferences</h2>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-[#0B0F19] border border-white/5 rounded-xl max-w-md">
            <div>
              <div className="text-white font-medium">Dark Mode</div>
              <div className="text-xs text-gray-500">The platform permanently uses Deep Navy.</div>
            </div>
            <div className="w-12 h-6 bg-purple-600 rounded-full flex items-center px-1 justify-end">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </section>
        
      </div>
    </div>
  )
}
