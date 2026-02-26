'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, User, FileText, Eye } from 'lucide-react'

interface ContentDraft {
  id: string
  title: string
  author: 'Kelly' | 'Rachel'
  type: 'X Content' | 'LinkedIn Content'
  date: string
  status: 'Draft' | 'Review' | 'Published'
  excerpt: string
  content: string
  metadata: {
    wordCount: number
    estimatedReadTime: number
  }
}

interface ContentSectionProps {
  className?: string
}

export default function ContentSection({ className = '' }: ContentSectionProps) {
  const [drafts, setDrafts] = useState<ContentDraft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<ContentDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadContentDrafts()
  }, [])

  const loadContentDrafts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load actual content files from workspace
      const contentFiles = [
        {
          id: 'kelly-angle-bank',
          path: '/Users/georgeopenclaw/.openclaw/workspace/content/kelly-angle-bank.md',
          author: 'Kelly' as const,
          type: 'X Content' as const
        },
        {
          id: 'rachel-linkedin-calendar', 
          path: '/Users/georgeopenclaw/.openclaw/workspace/content/rachel-linkedin-calendar.md',
          author: 'Rachel' as const,
          type: 'LinkedIn Content' as const
        }
      ]

      const loadedDrafts: ContentDraft[] = []

      for (const file of contentFiles) {
        try {
          const response = await fetch(`/api/read-file?path=${encodeURIComponent(file.path)}`)
          if (!response.ok) {
            console.warn(`Failed to load ${file.path}`)
            continue
          }
          
          const content = await response.text()
          
          // Extract title from first line
          const lines = content.split('\n')
          const title = lines[0].replace(/^#\s*/, '') || `${file.author} Content Draft`
          
          // Extract excerpt from second line or description
          const excerpt = lines.find(line => line.startsWith('*') && line.includes('|'))?.replace(/^\*|\*$/g, '') || 
                         lines.slice(1, 3).join(' ').substring(0, 100) + '...'
          
          // Get file stats
          const statResponse = await fetch(`/api/file-stats?path=${encodeURIComponent(file.path)}`)
          let fileDate = new Date().toISOString().split('T')[0]
          if (statResponse.ok) {
            const stats = await statResponse.json()
            fileDate = new Date(stats.mtime).toISOString().split('T')[0]
          }
          
          // Calculate word count and read time
          const wordCount = content.split(/\s+/).length
          const estimatedReadTime = Math.ceil(wordCount / 250)
          
          loadedDrafts.push({
            id: file.id,
            title,
            author: file.author,
            type: file.type,
            date: fileDate,
            status: 'Draft',
            excerpt,
            content,
            metadata: {
              wordCount,
              estimatedReadTime
            }
          })
        } catch (err) {
          console.warn(`Error loading ${file.path}:`, err)
        }
      }

      // Fallback to mock data if no files loaded
      if (loadedDrafts.length === 0) {
        const mockDrafts: ContentDraft[] = [
          {
            id: 'kelly-angle-bank',
            title: "Kelly's Content Angle Bank",
            author: 'Kelly',
            type: 'X Content',
            date: '2026-02-26',
            status: 'Draft',
            excerpt: '20 High-Performing Tweet Formats for Infrastructure & Staking Narratives',
            content: `# Kelly's Content Angle Bank
*20 High-Performing Tweet Formats for Infrastructure & Staking Narratives*

## 1. The Data Drop
**Structure:** [Shocking stat] + [Context] + [Why it matters] + [Call to action]

## 2. The Unpopular Opinion Bomb  
**Structure:** "Unpopular opinion:" + [Contrarian take] + [Supporting evidence] + [Future prediction]

[Content truncated for demo - this would be the full Kelly content]`,
            metadata: {
              wordCount: 2847,
              estimatedReadTime: 11
            }
          },
          {
            id: 'rachel-linkedin-calendar',
            title: 'Rachel LinkedIn Content Calendar - 30 Days',
            author: 'Rachel',
            type: 'LinkedIn Content',
            date: '2026-02-14',
            status: 'Review',
            excerpt: 'For Brandon Geraldi | Phase Labs CEO - 8 weeks of strategic LinkedIn content',
            content: `# Rachel LinkedIn Content Calendar - 30 Days
**For Brandon Geraldi | Phase Labs CEO**

## Strategy Overview
**Weeks 1-2: Authority Establishment**
- Position Brandon as a Solana ecosystem expert

[Content truncated for demo - this would be the full Rachel content]`,
            metadata: {
              wordCount: 4521,
              estimatedReadTime: 18
            }
          }
        ]
        setDrafts(mockDrafts)
      } else {
        setDrafts(loadedDrafts)
      }
    } catch (err) {
      setError('Failed to load content drafts')
      console.error('Error loading drafts:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatContent = (content: string) => {
    // Convert markdown to basic formatting for preview
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-pixel text-accent mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-pixel text-text mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-md font-pixel text-text2 mb-2 mt-4">$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong class="font-semibold text-text">$1</strong>')
      .replace(/^\*(.*?)\*/gm, '<em class="italic text-text2">$1</em>')
      .replace(/^- (.*$)/gm, '<li class="text-text2 mb-1 ml-4">• $1</li>')
      .replace(/\n\n/g, '</p><p class="text-text2 mb-4">')
      .replace(/^(?!<[h|l|p])(.*$)/gm, '<p class="text-text2 mb-4">$1</p>')
  }

  const getStatusColor = (status: ContentDraft['status']) => {
    switch (status) {
      case 'Draft': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'Review': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'Published': return 'text-green-400 bg-green-400/10 border-green-400/30'
      default: return 'text-text2 bg-text2/10 border-text2/30'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          <div className="font-pixel text-accent text-sm mb-2">LOADING DRAFTS</div>
          <div className="text-text2 text-xs">Reading workspace content...</div>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="font-pixel text-red-400 text-sm mb-2">ERROR</div>
        <div className="text-text2 text-xs">{error}</div>
        <button
          onClick={loadContentDrafts}
          className="mt-4 px-3 py-1 border border-border hover:border-accent transition-colors font-pixel text-xs text-text2 hover:text-text"
        >
          RETRY
        </button>
      </div>
    )
  }

  if (selectedDraft) {
    return (
      <div className={`${className}`}>
        {/* Preview Header */}
        <div className="border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setSelectedDraft(null)}
              className="text-accent hover:text-accent/80 font-pixel text-xs"
            >
              ← BACK
            </button>
            <div className="flex-1" />
            <span className={`px-2 py-1 border text-xs font-pixel ${getStatusColor(selectedDraft.status)}`}>
              {selectedDraft.status}
            </span>
          </div>
          <h1 className="font-pixel text-text mb-2">{selectedDraft.title}</h1>
          <div className="flex items-center gap-4 text-xs text-text2">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {selectedDraft.author}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {selectedDraft.date}
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {selectedDraft.metadata.wordCount} words
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {selectedDraft.metadata.estimatedReadTime} min read
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="prose prose-sm max-w-none">
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatContent(selectedDraft.content) }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <h2 className="font-pixel text-text mb-2">CONTENT DRAFTS</h2>
        <p className="text-xs text-text2">
          Kelly & Rachel's latest drafts from the workspace
        </p>
      </div>

      <div className="space-y-3">
        {drafts.map((draft) => (
          <motion.div
            key={draft.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="border border-border bg-surface hover:bg-surface2 cursor-pointer transition-colors"
            onClick={() => setSelectedDraft(draft)}
          >
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-pixel text-sm text-text">{draft.title}</h3>
                <span className={`px-2 py-1 border text-xs font-pixel ${getStatusColor(draft.status)}`}>
                  {draft.status}
                </span>
              </div>
              
              <p className="text-xs text-text2 mb-3 line-clamp-2">
                {draft.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-text2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {draft.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {draft.date}
                  </div>
                </div>
                <div className="text-accent font-pixel text-xs">
                  {draft.type}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {drafts.length === 0 && (
        <div className="text-center py-8">
          <div className="font-pixel text-text2 text-sm mb-2">NO DRAFTS</div>
          <div className="text-text2 text-xs">No content found in workspace</div>
        </div>
      )}
    </div>
  )
}