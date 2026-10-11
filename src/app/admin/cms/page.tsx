import { Search, Home, Info, HelpCircle, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { updateHomepageSettings } from "./actions";

export const instant = false;

export default async function WebsiteCMSPage() {
  const { data: settings } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "homepage")
    .single();

  const val = settings?.value || { hero_title: "", hero_subtitle: "", announcement: "" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Website Content Management</h2>
          <p className="text-gray-500">Edit the public-facing pages of the website without coding.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Pages List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Find a page..." 
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg bg-blue-50 text-blue-700">
              <Home size={18} />
              <span className="font-medium">Homepage</span>
            </button>
            <button disabled className="w-full flex items-center gap-3 p-3 text-left rounded-lg text-gray-400 hover:bg-gray-50 cursor-not-allowed">
              <Info size={18} className="text-gray-300" />
              <span className="font-medium">About Us (Soon)</span>
            </button>
            <button disabled className="w-full flex items-center gap-3 p-3 text-left rounded-lg text-gray-400 hover:bg-gray-50 cursor-not-allowed">
              <HelpCircle size={18} className="text-gray-300" />
              <span className="font-medium">FAQ (Soon)</span>
            </button>
          </div>
        </div>

        {/* Right Column - Editor */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
          <form action={updateHomepageSettings} className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <Home size={20} className="text-blue-600" />
                <h3 className="font-bold text-gray-900">Editing: Homepage</h3>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                <Save size={16} /> Publish Changes
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Top Banner</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Text</label>
                  <input 
                    type="text" 
                    name="announcement"
                    defaultValue={val.announcement}
                    placeholder="e.g. New GATE papers added!"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hero Section Edit */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Hero Section</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Headline (H1)</label>
                  <input 
                    type="text" 
                    name="hero_title"
                    defaultValue={val.hero_title}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                  <textarea 
                    name="hero_subtitle"
                    rows={3}
                    defaultValue={val.hero_subtitle}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  ></textarea>
                </div>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
