import { ArrowRight } from 'lucide-react'
import type { AuditEntry } from '@/types'
import { dateTime } from '@/lib/format'
import { initials } from '@/lib/format'

export function AuditTrail({ entries, compact }: { entries: AuditEntry[]; compact?: boolean }) {
  const list = compact ? entries.slice(-4) : entries

  return (
    <ol className="relative space-y-0">
      {compact && entries.length > list.length && (
        <li className="pb-3 pl-8 text-[11.5px] text-steel-500">
          {entries.length - list.length} earlier entr{entries.length - list.length === 1 ? 'y' : 'ies'}
        </li>
      )}
      {list.map((e, i) => (
        <li key={e.id} className="relative pb-4 pl-8 last:pb-0">
          {i < list.length - 1 && <span className="absolute left-[11px] top-6 h-full w-px bg-steel-800" />}
          <span className="absolute left-0 top-0 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-steel-700 bg-steel-850 text-[9px] font-bold text-steel-300">
            {initials(e.actorName)}
          </span>
          <p className="text-[13px] font-semibold leading-snug text-steel-100">{e.action}</p>
          <p className="mt-0.5 text-[11.5px] text-steel-500">
            {e.actorName} · {dateTime(e.at)} · v{e.version}
          </p>
          {e.field && (
            <p className="tabular mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-steel-300">
              <span className="font-semibold text-steel-400">{e.field}</span>
              <span className="text-steel-500 line-through">{e.from}</span>
              <ArrowRight size={11} className="text-steel-600" />
              <span className="font-semibold text-amber-500">{e.to}</span>
            </p>
          )}
          {e.reason && <p className="mt-0.5 text-[11.5px] italic text-steel-400">Reason: {e.reason}</p>}
          {e.detail && <p className="mt-0.5 text-[11.5px] leading-snug text-steel-500">{e.detail}</p>}
        </li>
      ))}
    </ol>
  )
}
