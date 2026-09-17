// ---------------------------------------------------------------------------
// Deterministic, fully inline "photograph" placeholders.
//
// The prototype must never fetch an image, so every capture thumbnail is an
// SVG string generated here. Shapes are deliberately schematic: they read as
// a quayside snapshot at thumbnail size without pretending to be a photo.
// ---------------------------------------------------------------------------

export type CargoShape =
  | 'pallet'
  | 'steel-plate'
  | 'pipe-bundle'
  | 'crate'
  | 'drum'
  | 'ibc'
  | 'irregular'
  | 'label'

export interface CaptureImageSpec {
  shape: CargoShape
  view: 'front' | 'side' | 'corner' | 'label'
  /** cargo body colour */
  body: string
  /** accent / strapping colour */
  accent: string
  caption: string
}

const QUAY_BG = '#243040'
const QUAY_DECK = '#2f3a49'
const SKY = '#38465a'

function grain(seed: number): string {
  // A handful of fixed specks so the surface is not perfectly flat.
  const pts: string[] = []
  let s = seed
  for (let i = 0; i < 26; i++) {
    s = (s * 1103515245 + 12345) % 2147483647
    const x = 6 + (s % 288)
    s = (s * 1103515245 + 12345) % 2147483647
    const y = 6 + (s % 208)
    s = (s * 1103515245 + 12345) % 2147483647
    const r = 0.6 + (s % 14) / 10
    pts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="0.045"/>`)
  }
  return pts.join('')
}

function body(spec: CaptureImageSpec): string {
  const { shape, view, body: c, accent } = spec
  const dark = shade(c, -28)
  const light = shade(c, 18)

  switch (shape) {
    case 'pallet': {
      const w = view === 'side' ? 130 : 168
      const x = 150 - w / 2
      return `
        <rect x="${x}" y="88" width="${w}" height="76" fill="${c}"/>
        <rect x="${x}" y="88" width="${w}" height="12" fill="${light}"/>
        <rect x="${x}" y="164" width="${w}" height="20" fill="${dark}"/>
        <rect x="${x + 6}" y="184" width="16" height="14" fill="#6b5436"/>
        <rect x="${x + w / 2 - 8}" y="184" width="16" height="14" fill="#6b5436"/>
        <rect x="${x + w - 22}" y="184" width="16" height="14" fill="#6b5436"/>
        <rect x="${x + w * 0.28}" y="88" width="5" height="76" fill="${accent}" opacity="0.85"/>
        <rect x="${x + w * 0.68}" y="88" width="5" height="76" fill="${accent}" opacity="0.85"/>
        <rect x="${x}" y="120" width="${w}" height="4" fill="${accent}" opacity="0.5"/>`
    }
    case 'steel-plate': {
      const h = view === 'front' ? 30 : 26
      return `
        <rect x="42" y="${150 - h}" width="216" height="${h}" fill="${c}"/>
        <rect x="42" y="${150 - h}" width="216" height="5" fill="${light}"/>
        <rect x="42" y="150" width="216" height="9" fill="${dark}"/>
        <rect x="42" y="159" width="216" height="${h}" fill="${shade(c, -10)}"/>
        <rect x="42" y="159" width="216" height="4" fill="${light}" opacity="0.5"/>
        <rect x="42" y="${159 + h}" width="216" height="9" fill="${dark}"/>
        <rect x="78" y="${144 - h}" width="8" height="${2 * h + 28}" fill="${accent}" opacity="0.8"/>
        <rect x="212" y="${144 - h}" width="8" height="${2 * h + 28}" fill="${accent}" opacity="0.8"/>`
    }
    case 'pipe-bundle': {
      const circles: string[] = []
      const rows = [
        { y: 150, n: 5 },
        { y: 124, n: 4 },
        { y: 98, n: 3 },
      ]
      rows.forEach((row) => {
        const startX = 150 - ((row.n - 1) * 30) / 2
        for (let i = 0; i < row.n; i++) {
          const cx = startX + i * 30
          circles.push(
            `<circle cx="${cx}" cy="${row.y}" r="14" fill="${c}"/><circle cx="${cx}" cy="${row.y}" r="7" fill="${dark}"/><path d="M${cx - 10} ${row.y - 9} A14 14 0 0 1 ${cx + 6} ${row.y - 12}" stroke="${light}" stroke-width="2.5" fill="none"/>`,
          )
        }
      })
      return `${circles.join('')}
        <rect x="96" y="82" width="7" height="84" fill="${accent}" opacity="0.9"/>
        <rect x="197" y="82" width="7" height="84" fill="${accent}" opacity="0.9"/>
        <rect x="60" y="164" width="180" height="10" fill="#5c4a30"/>`
    }
    case 'crate': {
      const w = view === 'side' ? 132 : 176
      const x = 150 - w / 2
      return `
        <rect x="${x}" y="72" width="${w}" height="112" fill="${c}"/>
        <rect x="${x}" y="72" width="${w}" height="10" fill="${light}"/>
        <rect x="${x}" y="174" width="${w}" height="10" fill="${dark}"/>
        <path d="M${x} 82 L${x + w} 174 M${x + w} 82 L${x} 174" stroke="${dark}" stroke-width="7" opacity="0.65"/>
        <rect x="${x}" y="122" width="${w}" height="8" fill="${dark}" opacity="0.7"/>
        <rect x="${x + 10}" y="184" width="18" height="12" fill="#5c4a30"/>
        <rect x="${x + w - 28}" y="184" width="18" height="12" fill="#5c4a30"/>
        <circle cx="${x + 20}" cy="90" r="5" fill="${accent}"/>
        <circle cx="${x + w - 20}" cy="90" r="5" fill="${accent}"/>`
    }
    case 'drum': {
      const drums = view === 'side' ? 2 : 4
      const out: string[] = []
      const startX = 150 - ((drums - 1) * 46) / 2
      for (let i = 0; i < drums; i++) {
        const x = startX + i * 46 - 20
        out.push(`
          <rect x="${x}" y="86" width="40" height="96" rx="4" fill="${c}"/>
          <ellipse cx="${x + 20}" cy="88" rx="20" ry="7" fill="${light}"/>
          <rect x="${x}" y="108" width="40" height="6" fill="${dark}"/>
          <rect x="${x}" y="150" width="40" height="6" fill="${dark}"/>
          <rect x="${x + 4}" y="86" width="4" height="96" fill="${light}" opacity="0.35"/>`)
      }
      out.push(`<rect x="52" y="182" width="196" height="14" fill="#5c4a30"/>`)
      return out.join('')
    }
    case 'ibc': {
      return `
        <rect x="82" y="80" width="136" height="92" rx="6" fill="${c}" opacity="0.92"/>
        <g stroke="${accent}" stroke-width="3.5" opacity="0.95">
          ${[92, 110, 128, 146, 164].map((y) => `<line x1="82" y1="${y}" x2="218" y2="${y}"/>`).join('')}
          ${[100, 118, 136, 154, 172, 190, 208].map((x) => `<line x1="${x}" y1="80" x2="${x}" y2="172"/>`).join('')}
        </g>
        <rect x="82" y="172" width="136" height="14" fill="${dark}"/>
        <rect x="138" y="70" width="24" height="12" rx="3" fill="${shade(c, -40)}"/>
        <rect x="70" y="186" width="160" height="12" fill="#5c4a30"/>`
    }
    case 'irregular': {
      return `
        <path d="M58 168 L74 96 L136 76 L186 104 L242 92 L246 168 Z" fill="${c}"/>
        <path d="M74 96 L136 76 L186 104 L138 118 Z" fill="${light}" opacity="0.6"/>
        <path d="M186 104 L242 92 L246 168 L200 168 Z" fill="${dark}" opacity="0.7"/>
        <rect x="58" y="168" width="188" height="12" fill="${dark}"/>
        <circle cx="116" cy="100" r="6" fill="${accent}"/>
        <circle cx="206" cy="112" r="6" fill="${accent}"/>
        <path d="M246 130 L272 138" stroke="${accent}" stroke-width="3" stroke-dasharray="5 4"/>`
    }
    case 'label': {
      return `
        <rect x="56" y="54" width="188" height="140" rx="6" fill="#e9eef5"/>
        <rect x="56" y="54" width="188" height="24" fill="#c9d3e0"/>
        <rect x="68" y="62" width="74" height="8" rx="2" fill="#5a6779"/>
        <rect x="196" y="62" width="34" height="8" rx="2" fill="#5a6779"/>
        ${[92, 106, 120].map((y, i) => `<rect x="68" y="${y}" width="${132 - i * 22}" height="7" rx="2" fill="#8593a5"/>`).join('')}
        <rect x="68" y="138" width="104" height="14" rx="2" fill="#1c2331"/>
        <g fill="#1c2331">
          ${Array.from({ length: 22 }, (_, i) => `<rect x="${70 + i * 7}" y="${160}" width="${i % 3 === 0 ? 4 : 2}" height="26"/>`).join('')}
        </g>
        <rect x="186" y="132" width="46" height="46" rx="3" fill="#1c2331"/>
        <rect x="194" y="140" width="30" height="30" fill="#e9eef5"/>
        <rect x="200" y="146" width="18" height="18" fill="#1c2331"/>`
    }
  }
}

/** Lighten / darken a #rrggbb hex by an amount in 0-255 space. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const clamp = (v: number) => Math.max(0, Math.min(255, v))
  const r = clamp(((n >> 16) & 255) + amt)
  const g = clamp(((n >> 8) & 255) + amt)
  const b = clamp((n & 255) + amt)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

const VIEW_OVERLAY: Record<CaptureImageSpec['view'], string> = {
  front: `<g stroke="#ffb020" stroke-width="1.6" opacity="0.5" fill="none">
      <rect x="34" y="60" width="232" height="148" stroke-dasharray="8 7"/>
      <line x1="150" y1="52" x2="150" y2="216" stroke-dasharray="4 8" opacity="0.6"/>
    </g>`,
  side: `<g stroke="#ffb020" stroke-width="1.6" opacity="0.5" fill="none">
      <rect x="40" y="62" width="220" height="144" stroke-dasharray="8 7"/>
      <line x1="40" y1="134" x2="260" y2="134" stroke-dasharray="4 8" opacity="0.6"/>
    </g>`,
  corner: `<g stroke="#ffb020" stroke-width="1.6" opacity="0.5" fill="none">
      <path d="M46 70 L46 50 L70 50 M230 50 L254 50 L254 70 M254 196 L254 216 L230 216 M70 216 L46 216 L46 196" stroke-width="2.6" opacity="0.85"/>
      <path d="M60 200 L240 74" stroke-dasharray="6 7" opacity="0.5"/>
    </g>`,
  label: `<g stroke="#ffb020" stroke-width="2.2" opacity="0.7" fill="none">
      <path d="M50 44 L50 30 L64 30 M236 30 L250 30 L250 44 M250 204 L250 218 L236 218 M64 218 L50 218 L50 204"/>
    </g>`,
}

export function captureSvg(spec: CaptureImageSpec, seed = 7, opts: { overlay?: boolean } = {}): string {
  const overlay = opts.overlay === false ? '' : VIEW_OVERLAY[spec.view]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 232" width="300" height="232" role="img" aria-label="${spec.caption}">
  <defs>
    <linearGradient id="sky${seed}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SKY}"/>
      <stop offset="1" stop-color="${QUAY_BG}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="232" fill="url(#sky${seed})"/>
  <rect y="178" width="300" height="54" fill="${QUAY_DECK}"/>
  <rect y="178" width="300" height="2" fill="#4a5568" opacity="0.5"/>
  <g opacity="0.35" fill="#1a2230">
    <rect x="0" y="150" width="46" height="30"/>
    <rect x="262" y="142" width="38" height="38"/>
    <rect x="196" y="160" width="26" height="20"/>
  </g>
  ${grain(seed)}
  ${body(spec)}
  <g opacity="0.22" fill="#000000">
    <ellipse cx="150" cy="196" rx="104" ry="9"/>
  </g>
  ${overlay}
  <rect x="0" y="0" width="300" height="232" fill="none" stroke="#000000" stroke-opacity="0.35" stroke-width="2"/>
</svg>`
}

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const CAPTURE_PALETTES: Record<string, { body: string; accent: string; shape: CargoShape }> = {
  pallet: { body: '#9a7a4e', accent: '#2f6fb3', shape: 'pallet' },
  steel: { body: '#7c8794', accent: '#c9a227', shape: 'steel-plate' },
  pipe: { body: '#6e7a86', accent: '#2f6fb3', shape: 'pipe-bundle' },
  crate: { body: '#8a6d45', accent: '#d94f2b', shape: 'crate' },
  drum: { body: '#2f6fb3', accent: '#d94f2b', shape: 'drum' },
  ibc: { body: '#9fb4c7', accent: '#5a6779', shape: 'ibc' },
  irregular: { body: '#6b7b6a', accent: '#ffb020', shape: 'irregular' },
}
