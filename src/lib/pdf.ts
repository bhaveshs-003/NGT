import { jsPDF } from 'jspdf'
import type { Assessment, Job, User } from '@/types'
import { svgToDataUri } from '@/data/images'
import { crane } from '@/data/craneLoadCharts'
import { userName } from '@/data/users'
import { SOURCE_LABEL } from './confidence'
import { dateTime, kg, metres, mm, pct } from './format'
import type { LiftCalculation } from './lifting'

/**
 * Rasterise an inline SVG so jsPDF can embed it. Data URIs do not taint the
 * canvas, and nothing here touches the network.
 */
async function svgToPng(svg: string, width = 300, height = 232): Promise<string | null> {
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = width * 2
        canvas.height = height * 2
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no 2d context'))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('svg decode failed'))
      img.src = svgToDataUri(svg)
    })
  } catch {
    return null
  }
}

const AMBER: [number, number, number] = [230, 146, 0]
const DARK: [number, number, number] = [20, 26, 36]
const GREY: [number, number, number] = [110, 120, 133]
const RED: [number, number, number] = [200, 40, 40]

export async function exportPermitPdf(
  a: Assessment,
  job: Job | undefined,
  calc: LiftCalculation,
  user: User,
): Promise<string> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const M = 14
  let y = 0

  // --- header --------------------------------------------------------------
  doc.setFillColor(...DARK)
  doc.rect(0, 0, pageW, 26, 'F')
  doc.setFillColor(...AMBER)
  doc.rect(0, 26, pageW, 1.6, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('LIFTING PERMIT — CARGO ASSESSMENT', M, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('NGT Lifting & Cargo Services', M, 18)
  doc.setFontSize(8)
  doc.text(`${a.ref}  ·  version ${a.version}  ·  ${a.status === 'verified' ? 'VERIFIED' : 'ESTIMATED'}`, pageW - M, 12, {
    align: 'right',
  })
  doc.text(`Issued ${dateTime(new Date().toISOString())}`, pageW - M, 18, { align: 'right' })

  y = 36

  // --- job block -----------------------------------------------------------
  y = sectionTitle(doc, 'Job', M, y)
  y = kvGrid(
    doc,
    [
      ['Job reference', job?.ref ?? '—'],
      ['Vessel', job?.vessel ?? '—'],
      ['Berth', job?.berth ?? '—'],
      ['Shift', job?.shift ?? '—'],
      ['Assessed by', `${userName(a.createdBy)} (${user.deviceId})`],
      ['Assessed at', dateTime(a.createdAt)],
    ],
    M,
    y,
    pageW,
  )

  // --- cargo ---------------------------------------------------------------
  y = sectionTitle(doc, 'Cargo assessment', M, y + 4)
  y = fieldTable(
    doc,
    [
      ['Cargo type', String(a.cargoType.value), a.cargoType.confidence, SOURCE_LABEL[a.cargoType.source]],
      ['Material', String(a.material.value), a.material.confidence, SOURCE_LABEL[a.material.source]],
      ['Packaging', String(a.packaging.value), a.packaging.confidence, SOURCE_LABEL[a.packaging.source]],
      ['Length', mm(a.dimensions.length.value), a.dimensions.length.confidence, SOURCE_LABEL[a.dimensions.length.source]],
      ['Width', mm(a.dimensions.width.value), a.dimensions.width.confidence, SOURCE_LABEL[a.dimensions.width.source]],
      ['Height', mm(a.dimensions.height.value), a.dimensions.height.confidence, SOURCE_LABEL[a.dimensions.height.source]],
      ['Weight', kg(a.weightKg.value), a.weightKg.confidence, SOURCE_LABEL[a.weightKg.source]],
    ],
    M,
    y,
    pageW,
  )

  // --- lift ----------------------------------------------------------------
  y = sectionTitle(doc, 'Lift calculation', M, y + 4)
  y = kvGrid(
    doc,
    [
      ['Cargo weight', kg(calc.cargoKg)],
      ['Rigging weight', kg(calc.riggingKg, { decimals: 1 })],
      [`Contingency (${calc.contingencyPct} %)`, kg(calc.contingencyKg)],
      ['GROSS WEIGHT', kg(calc.grossKg)],
      ['Sling angle', `${a.liftPlan?.slingAngleDeg ?? 60}°  (factor ×${calc.angleFactor.toFixed(2)})`],
      ['Load per leg', kg(calc.legLoadKg)],
    ],
    M,
    y,
    pageW,
  )

  y = sectionTitle(doc, 'Rigging', M, y + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  calc.rigging.forEach((r) => {
    doc.text(`•  ${r.qty} × ${r.label} — ${r.detail}  (${kg(r.totalKg, { decimals: 1 })})`, M, y)
    y += 5
  })
  if (!calc.rigging.length) {
    doc.text('•  No rigging recorded.', M, y)
    y += 5
  }

  y = sectionTitle(doc, 'Crane capacity check', M, y + 2)
  const c = a.liftPlan ? crane(a.liftPlan.craneId) : undefined
  y = kvGrid(
    doc,
    [
      ['Crane', c ? `${c.name} (${c.type})` : '—'],
      ['Configuration', calc.boomLabel],
      ['Working radius', metres(calc.radiusM, 0)],
      ['Chart capacity', kg(calc.capacityKg)],
      ['Utilisation', pct(calc.utilisationPct, 0)],
      ['Status', calc.overCapacity ? 'OVER CHART — DO NOT LIFT' : calc.nearCapacity ? 'ABOVE 85 % — APPROVAL REQUIRED' : 'Within working limits'],
    ],
    M,
    y,
    pageW,
    calc.nearCapacity ? RED : undefined,
  )

  // --- flags ---------------------------------------------------------------
  if (a.flags.length) {
    y = sectionTitle(doc, 'Flags and cautions', M, y + 4)
    doc.setFontSize(9)
    a.flags.forEach((f) => {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(f.severity === 'critical' ? RED : DARK))
      doc.text(`•  ${f.label} [${f.severity}]`, M, y)
      y += 4.4
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GREY)
      doc.splitTextToSize(f.detail, pageW - M * 2 - 4).forEach((line: string) => {
        doc.text(line, M + 4, y)
        y += 4
      })
      y += 1
    })
  }

  // --- captures ------------------------------------------------------------
  if (y > 225) {
    doc.addPage()
    y = 20
  }
  y = sectionTitle(doc, 'Capture set', M, y + 2)
  const thumbW = (pageW - M * 2 - 9) / 4
  const thumbH = thumbW * (232 / 300)
  let x = M
  for (const cap of a.captures.slice(0, 4)) {
    const png = await svgToPng(cap.svg)
    if (png) {
      doc.addImage(png, 'PNG', x, y, thumbW, thumbH)
    } else {
      doc.setDrawColor(...GREY)
      doc.rect(x, y, thumbW, thumbH)
    }
    doc.setFontSize(7)
    doc.setTextColor(...GREY)
    doc.text(cap.label, x, y + thumbH + 3.5)
    x += thumbW + 3
  }
  y += thumbH + 8

  // --- sign-off ------------------------------------------------------------
  if (y > 250) {
    doc.addPage()
    y = 20
  }
  y = sectionTitle(doc, 'Sign-off', M, y)
  doc.setDrawColor(...GREY)
  doc.setFontSize(8)
  doc.setTextColor(...GREY)
  const colW = (pageW - M * 2 - 8) / 2
  ;[
    ['Lifting supervisor', userName(a.createdBy)],
    ['Approved by', a.verifiedBy ? userName(a.verifiedBy) : '—'],
  ].forEach(([role, name], i) => {
    const cx = M + i * (colW + 8)
    doc.line(cx, y + 12, cx + colW, y + 12)
    doc.text(`${role}: ${name}`, cx, y + 16)
    doc.text('Signature / date', cx, y + 20)
  })
  y += 26

  doc.setFontSize(7)
  doc.setTextColor(...GREY)
  const footer =
    a.status === 'verified'
      ? `Verified and locked by ${userName(a.verifiedBy ?? '')} on ${dateTime(a.verifiedAt ?? '')}. Version ${a.version}.`
      : 'ESTIMATED VALUES — this record has not been verified. Not valid as a lifting permit until signed off.'
  doc.text(footer, M, doc.internal.pageSize.getHeight() - 12)
  doc.text(
    'Generated by the NGT Cargo Assessment field app (prototype). Values are AI-assisted estimates unless marked as manual entry.',
    M,
    doc.internal.pageSize.getHeight() - 8,
  )

  const filename = `${a.ref}-lift-permit-v${a.version}.pdf`
  doc.save(filename)
  return filename
}

// --- small layout helpers ---------------------------------------------------

function sectionTitle(doc: jsPDF, text: string, x: number, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...AMBER)
  doc.text(text.toUpperCase(), x, y)
  doc.setDrawColor(220, 224, 230)
  doc.line(x, y + 1.6, doc.internal.pageSize.getWidth() - x, y + 1.6)
  return y + 7
}

function kvGrid(
  doc: jsPDF,
  rows: [string, string][],
  x: number,
  y: number,
  pageW: number,
  highlight?: [number, number, number],
): number {
  const colW = (pageW - x * 2) / 2
  doc.setFontSize(9)
  rows.forEach(([k, v], i) => {
    const cx = x + (i % 2) * colW
    const cy = y + Math.floor(i / 2) * 6.5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREY)
    doc.text(`${k}`, cx, cy)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(highlight && (k === 'Status' || k === 'Utilisation') ? highlight : DARK))
    doc.text(v, cx + 42, cy, { maxWidth: colW - 44 })
  })
  return y + Math.ceil(rows.length / 2) * 6.5 + 2
}

function fieldTable(
  doc: jsPDF,
  rows: [string, string, number, string][],
  x: number,
  y: number,
  pageW: number,
): number {
  const w = pageW - x * 2
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GREY)
  doc.text('FIELD', x, y)
  doc.text('VALUE', x + 34, y)
  doc.text('CONF.', x + w - 34, y)
  doc.text('SOURCE', x + w - 22, y)
  y += 2
  doc.setDrawColor(228, 232, 238)
  doc.line(x, y, x + w, y)
  y += 4.5

  doc.setFontSize(9)
  rows.forEach(([k, v, conf, src]) => {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREY)
    doc.text(k, x, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text(v, x + 34, y, { maxWidth: w - 74 })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...(conf < 70 ? RED : GREY))
    doc.text(conf > 0 ? String(conf) : '—', x + w - 34, y)
    doc.setFontSize(7.5)
    doc.setTextColor(...GREY)
    doc.text(src, x + w - 22, y, { maxWidth: 24 })
    doc.setFontSize(9)
    y += 6
  })
  return y
}
