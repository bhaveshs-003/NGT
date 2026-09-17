import type { Assessment, LiftPlan } from '@/types'

/**
 * Sling geometry sketch: hook, legs at the included angle, load block and the
 * centre-of-gravity marker relative to the geometric centre.
 */
export function SlingAngleDiagram({
  angleDeg,
  legs,
  cogOffsetMm,
  loadWidthMm,
  legLoadKg,
  liftingPointsPresent,
}: {
  angleDeg: number
  legs: number
  cogOffsetMm: { x: number; y: number }
  loadWidthMm: number
  legLoadKg: number
  liftingPointsPresent: boolean
}) {
  const W = 260
  const H = 170

  const hookX = W / 2
  const hookY = 26
  const loadTop = 118
  const loadW = 150
  const loadH = 30
  const loadLeft = (W - loadW) / 2

  // Attachment points sit at the load corners; the leg angle drives how far
  // the hook sits above them.
  const halfSpan = loadW / 2 - 8
  const rad = (angleDeg * Math.PI) / 180
  const legRise = Math.min(loadTop - hookY - 6, halfSpan * Math.tan(rad))
  const legTopY = loadTop - legRise

  const leftX = loadLeft + 8
  const rightX = loadLeft + loadW - 8

  const cogShift = loadWidthMm > 0 ? Math.max(-loadW / 2 + 12, Math.min(loadW / 2 - 12, (cogOffsetMm.x / (loadWidthMm / 2)) * (loadW / 2))) : 0
  const cogX = W / 2 + cogShift
  const centreX = W / 2

  const angleColor = angleDeg < 45 ? '#ef4444' : angleDeg < 60 ? '#f59e0b' : '#22c55e'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Sling arrangement at ${angleDeg} degrees included angle`}>
      {/* hook */}
      <line x1={hookX} y1={6} x2={hookX} y2={hookY} stroke="#8593a5" strokeWidth="3" />
      <circle cx={hookX} cy={hookY + 4} r="6" fill="none" stroke="#8593a5" strokeWidth="3" />

      {/* legs */}
      <g stroke={angleColor} strokeWidth="2.4" fill="none">
        <line x1={hookX} y1={hookY + 9} x2={leftX} y2={loadTop} />
        <line x1={hookX} y1={hookY + 9} x2={rightX} y2={loadTop} />
        {legs >= 4 && (
          <>
            <line x1={hookX} y1={hookY + 9} x2={leftX + 18} y2={loadTop} strokeOpacity="0.4" strokeDasharray="3 3" />
            <line x1={hookX} y1={hookY + 9} x2={rightX - 18} y2={loadTop} strokeOpacity="0.4" strokeDasharray="3 3" />
          </>
        )}
      </g>

      {/* angle arc */}
      <path
        d={`M ${hookX - 22} ${legTopY + (loadTop - legTopY) * 0.0 + 30} A 26 26 0 0 1 ${hookX + 22} ${legTopY + 30}`}
        fill="none"
        stroke={angleColor}
        strokeWidth="1.2"
        strokeDasharray="3 2"
        opacity="0.7"
      />
      <text x={hookX} y={legTopY + 26} textAnchor="middle" fill={angleColor} fontSize="12" fontWeight="700">
        {angleDeg}°
      </text>

      {/* load */}
      <rect x={loadLeft} y={loadTop} width={loadW} height={loadH} rx="2" fill="#3b4655" stroke="#5a6779" strokeWidth="1.5" />
      <rect x={loadLeft} y={loadTop + loadH} width={loadW} height="6" fill="#2a3342" />

      {/* attachment points */}
      {[leftX, rightX].map((x) => (
        <circle
          key={x}
          cx={x}
          cy={loadTop}
          r="4"
          fill={liftingPointsPresent ? '#22c55e' : '#ef4444'}
          stroke="#0f141c"
          strokeWidth="1.5"
        />
      ))}

      {/* geometric centre */}
      <line x1={centreX} y1={loadTop - 4} x2={centreX} y2={loadTop + loadH + 10} stroke="#5a6779" strokeWidth="1" strokeDasharray="3 3" />

      {/* centre of gravity */}
      <g>
        <circle cx={cogX} cy={loadTop + loadH / 2} r="7" fill="#0f141c" stroke="#ffb020" strokeWidth="1.6" />
        <path
          d={`M ${cogX - 7} ${loadTop + loadH / 2} A 7 7 0 0 1 ${cogX} ${loadTop + loadH / 2 - 7} L ${cogX} ${loadTop + loadH / 2} Z`}
          fill="#ffb020"
        />
        <path
          d={`M ${cogX + 7} ${loadTop + loadH / 2} A 7 7 0 0 1 ${cogX} ${loadTop + loadH / 2 + 7} L ${cogX} ${loadTop + loadH / 2} Z`}
          fill="#ffb020"
        />
      </g>
      <text x={cogX} y={loadTop + loadH + 22} textAnchor="middle" fill="#ffb020" fontSize="9" fontWeight="700">
        CoG
      </text>

      {/* leg load callout */}
      <text x={leftX - 6} y={loadTop - 10} textAnchor="end" fill="#b3bfcd" fontSize="9.5">
        {legLoadKg.toLocaleString('en-GB')} kg
      </text>
      <text x={rightX + 6} y={loadTop - 10} textAnchor="start" fill="#b3bfcd" fontSize="9.5">
        per leg
      </text>
    </svg>
  )
}

/** Small read-only version used on the permit card. */
export function LiftSketch({ assessment, plan, legLoadKg }: { assessment: Assessment; plan: LiftPlan; legLoadKg: number }) {
  return (
    <SlingAngleDiagram
      angleDeg={plan.slingAngleDeg}
      legs={plan.rigging.slingCount}
      cogOffsetMm={plan.cogOffsetMm}
      loadWidthMm={assessment.dimensions.length.value}
      legLoadKg={legLoadKg}
      liftingPointsPresent={plan.liftingPointsPresent}
    />
  )
}
