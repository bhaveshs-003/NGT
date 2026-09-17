import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownWideNarrow, ArrowUpWideNarrow, History as HistoryIcon, Search, SlidersHorizontal, X } from 'lucide-react'
import { AssessmentCard } from '@/components/AssessmentCard'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { EmptyState, ListSkeleton } from '@/components/Feedback'
import { Screen, ScreenHeader } from '@/components/Screen'
import { Sheet } from '@/components/Sheet'
import { RadioRow } from '@/components/Form'
import { useApp } from '@/store/useApp'
import type { AssessmentStatus } from '@/types'

const STATUS_FILTERS: { value: AssessmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Estimated' },
  { value: 'overridden', label: 'Overridden' },
  { value: 'verified', label: 'Verified and locked' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
  { value: 'queued-offline', label: 'Queued offline' },
]

export function History() {
  const navigate = useNavigate()
  const assessments = useApp((s) => s.assessments)
  const jobs = useApp((s) => s.jobs)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [status, setStatus] = useState<AssessmentStatus | 'all'>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 560)
    return () => clearTimeout(t)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assessments
      .filter((a) => (status === 'all' ? true : a.status === status))
      .filter((a) => {
        if (!q) return true
        const job = jobs.find((j) => j.id === a.jobId)
        return [
          a.ref,
          String(a.cargoType.value),
          String(a.material.value),
          String(a.packaging.value),
          a.labelText ?? '',
          job?.ref ?? '',
          job?.title ?? '',
          job?.vessel ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .sort((x, y) => {
        const dx = new Date(x.updatedAt).getTime()
        const dy = new Date(y.updatedAt).getTime()
        return sort === 'newest' ? dy - dx : dx - dy
      })
  }, [assessments, jobs, query, sort, status])

  const activeFilters = (status !== 'all' ? 1 : 0) + (sort !== 'newest' ? 1 : 0)

  return (
    <Screen
      header={
        <ScreenHeader
          title="History"
          subtitle={`${assessments.length} assessments on this device`}
          right={
            <button
              onClick={() => setFilterOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-steel-300 hover:bg-steel-800"
              aria-label="Filters"
            >
              <SlidersHorizontal size={19} />
              {activeFilters > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-steel-900" />
              )}
            </button>
          }
        />
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference, cargo, vessel, label text"
            className="min-h-[48px] w-full rounded-xl border border-steel-700 bg-steel-850 pl-10 pr-10 text-[14px] text-steel-100 placeholder:text-steel-500 focus:border-amber-500"
            aria-label="Search assessments"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-steel-400 hover:text-steel-100"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1.5 rounded-lg border border-steel-700 bg-steel-850 px-2.5 py-1.5 text-[12px] font-semibold text-steel-300"
          >
            {sort === 'newest' ? <ArrowDownWideNarrow size={13} /> : <ArrowUpWideNarrow size={13} />}
            {sort === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
          {status !== 'all' && (
            <button onClick={() => setStatus('all')} className="flex items-center gap-1">
              <Badge tone="amber" icon={<X size={10} />}>
                {STATUS_FILTERS.find((s) => s.value === status)?.label}
              </Badge>
            </button>
          )}
          <span className="ml-auto text-[12px] text-steel-500">{results.length} shown</span>
        </div>

        {loading ? (
          <ListSkeleton rows={4} />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon size={24} />}
            title={query || status !== 'all' ? 'Nothing matches' : 'No assessments yet'}
            body={
              query || status !== 'all'
                ? 'Try a different reference, cargo description or status filter.'
                : 'Assessments you capture appear here with their full audit trail.'
            }
            actionLabel={query || status !== 'all' ? 'Clear filters' : 'Start a capture'}
            onAction={() => {
              if (query || status !== 'all') {
                setQuery('')
                setStatus('all')
              } else navigate('/capture')
            }}
          />
        ) : (
          <div className="space-y-3">
            {results.map((a) => (
              <AssessmentCard key={a.id} assessment={a} href={`/history/${a.id}`} />
            ))}
          </div>
        )}
      </div>

      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter and sort"
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              block
              onClick={() => {
                setStatus('all')
                setSort('newest')
              }}
            >
              Reset
            </Button>
            <Button block onClick={() => setFilterOpen(false)}>
              Apply
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <span className="field-label mb-2 block">Sort</span>
            <div className="space-y-2">
              <RadioRow selected={sort === 'newest'} onSelect={() => setSort('newest')} title="Newest first" />
              <RadioRow selected={sort === 'oldest'} onSelect={() => setSort('oldest')} title="Oldest first" />
            </div>
          </div>
          <div>
            <span className="field-label mb-2 block">Status</span>
            <div className="space-y-2">
              {STATUS_FILTERS.map((f) => (
                <RadioRow key={f.value} selected={status === f.value} onSelect={() => setStatus(f.value)} title={f.label} />
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </Screen>
  )
}
