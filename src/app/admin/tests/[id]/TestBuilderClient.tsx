'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, Filter } from 'lucide-react'

export default function TestBuilderClient({ subjects, topics }: { subjects: any[], topics: any[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [subjectId, setSubjectId] = useState(searchParams.get('subject_id') || '')
  const [topicId, setTopicId] = useState(searchParams.get('topic_id') || '')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (subjectId) params.set('subject_id', subjectId)
    if (topicId) params.set('topic_id', topicId)
    
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="bg-[#111624] p-4 rounded-xl border border-white/10 mb-4 flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search question text..." 
          className="w-full bg-[#0B0F19] text-white pl-10 pr-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <select 
        value={subjectId}
        onChange={(e) => {
          setSubjectId(e.target.value);
          setTopicId(''); // reset topic when subject changes
        }}
        className="bg-[#0B0F19] text-white py-2 px-4 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none w-full md:w-auto"
      >
        <option value="">All Subjects</option>
        {subjects.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <select 
        value={topicId}
        onChange={(e) => setTopicId(e.target.value)}
        className="bg-[#0B0F19] text-white py-2 px-4 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none w-full md:w-auto"
      >
        <option value="">All Topics</option>
        {topics
          .filter(t => !subjectId || t.subject_id.toString() === subjectId)
          .map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <button 
        onClick={handleSearch}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full md:w-auto flex items-center justify-center gap-2"
      >
        <Filter size={18} /> Filter
      </button>
    </div>
  )
}
