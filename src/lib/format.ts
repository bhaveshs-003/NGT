/** Formatting helpers. Metric throughout, thin-space grouping for legibility. */

export function kg(value: number, opts: { decimals?: number } = {}): string {
  const d = opts.decimals ?? 0
  return `${value.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d })} kg`
}

export function tonnes(value: number): string {
  return `${(value / 1000).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`
}

export function mm(value: number): string {
  return `${Math.round(value).toLocaleString('en-GB')} mm`
}

export function metres(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)} m`
}

export function pct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)} %`
}

export function m3(value: number): string {
  return `${value.toFixed(2)} m³`
}

const DTF = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const TF = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
const DF = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export function dateTime(iso: string): string {
  if (!iso) return '—'
  return DTF.format(new Date(iso)).replace(',', '')
}

export function timeOnly(iso: string): string {
  if (!iso) return '—'
  return TF.format(new Date(iso))
}

export function dateOnly(iso: string): string {
  if (!iso) return '—'
  return DF.format(new Date(iso))
}

/** "12 min ago", "3 h ago", "Yesterday 14:22" — field-log style. */
export function relative(iso: string, now = Date.now()): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const diffMin = Math.round((now - then) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH} h ago`
  const diffD = Math.round(diffH / 24)
  if (diffD === 1) return `Yesterday ${timeOnly(iso)}`
  if (diffD < 7) return `${diffD} days ago`
  return dateOnly(iso)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
