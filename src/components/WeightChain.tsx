import { ArrowDown, Check, Minus, X } from 'lucide-react'
import type { WeightResolutionStep } from '@/types'
import { kg } from '@/lib/format'

const STATE = {
  used: { icon: <Check size={13} strokeWidth={3} />, cls: 'border-conf-high/45 bg-conf-high/10 text-conf-high', tag: 'Used' },
  'fallback-available': {
    icon: <Minus size={13} strokeWidth={3} />,
    cls: 'border-steel-700 bg-steel-850 text-steel-400',
    tag: 'Available',
  },
  unavailable: { icon: <X size={13} strokeWidth={3} />, cls: 'border-conf-low/40 bg-conf-low/10 text-conf-low', tag: 'Unavailable' },
  skipped: { icon: <Minus size={13} strokeWidth={3} />, cls: 'border-steel-700 bg-steel-850 text-steel-500', tag: 'Skipped' },
} as const

/**
 * Weight precedence: label read, then catalogue lookup, then density and
 * volume. The chain shows which rung produced the value and what the others
 * would have given.
 */
export function WeightChain({ chain }: { chain: WeightResolutionStep[] }) {
  if (!chain.length) {
    return (
      <p className="px-3.5 py-3 text-[12.5px] text-steel-500">
        Weight resolution has not run for this record yet.
      </p>
    )
  }

  return (
    <div className="px-3.5 py-3">
      {chain.map((step, i) => {
        const meta = STATE[step.status]
        return (
          <div key={step.method}>
            <div className={`rounded-xl border px-3 py-2.5 ${step.status === 'used' ? 'border-conf-high/45 bg-conf-high/[0.06]' : 'border-steel-800 bg-steel-850'}`}>
              <div className="flex items-start gap-2.5">
                <span className={`mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${meta.cls}`}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-bold text-steel-100">
                      {i + 1}. {step.label}
                    </p>
                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${step.status === 'used' ? 'text-conf-high' : 'text-steel-500'}`}>
                      {meta.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-steel-400">{step.detail}</p>
                  {step.value != null && (
                    <p className="tabular mt-1 text-[12.5px] font-semibold text-steel-200">
                      {kg(step.value)}
                      {step.confidence != null && (
                        <span className="ml-2 font-medium text-steel-500">confidence {step.confidence}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {i < chain.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown size={13} className="text-steel-600" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
