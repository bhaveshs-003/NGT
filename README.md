# NGT Cargo Assessment — Field User App (frontend prototype)

A mobile-responsive, **frontend-only** prototype of the NGT field application for AI-assisted cargo
assessment and crane lifting assistance. Every screen and state in the feature list is reachable and
interactive.

There is **no backend**. All inference, uploads, OCR, sync and push notifications are simulated in
`src/services/mock/` with realistic latency and seeded, repeatable outcomes. No network request of
any kind leaves the device — no image URLs, no runtime fonts, no analytics.

---

## ⚠️ Read this before you demo it

The feature list was written for native iOS and Android with on-device capture. **A web prototype
cannot use the camera, so the capture screens are representative rather than functional.** What is
real in the capture flow: the four-step sequence, the framing guides, the per-step guidance copy, the
quality gate and its retake prompt, per-frame preview, discard, and the capture-set review. What is
simulated: the image itself, which is generated as inline SVG on the device.

The app says so too — there is a "Simulated camera" notice on the capture brief and a **Simulated
viewport** watermark in the camera view — so nobody in the room is misled. If the audience includes
NGT operations people, say it out loud at step 3 of the click path below.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production build into dist/
npm run preview  # serve the production build
```

Node 20.12+ / npm 10+. Built with React 18, Vite 5, TypeScript, Tailwind, Zustand, react-router-dom,
lucide-react and jsPDF.

**Viewport.** Designed for 390×844 (iPhone 14) and usable from 320 px to 1280 px. On desktop the app
is centred in a phone-sized frame against a neutral backdrop. Use your browser's device toolbar for
the most representative view.

**Persistence.** State is held in `localStorage` under `ngt-field-assessment-v1`, so a reload keeps
jobs, assessments, overrides and settings. **Profile → Reset demo data** puts everything back to the
seeded state without signing you out — run it before each walkthrough.

---

## Demo credentials

| | |
|---|---|
| **Email** | `d.okafor@ngt-lifting.com` |
| **Password** | `Quayside2026` |

The sign-in screen shows these on-screen and has a **Fill demo credentials** button. The logged-in
user is Daniel Okafor, Lifting Supervisor, device `NGT-FLD-7741-A`. Two other users — Marta Reinholt
(Terminal Superintendent) and Ade Balogun (Crane Operator) — appear in audit trails and verification
stamps.

---

## Suggested 5-minute click path

This hits every major feature. Reset demo data first.

**0:00 — Sign in and register the device (30 s)**
Splash → Login → *Fill demo credentials* → **Sign in** → device registration screen shows the bound
device ID `NGT-FLD-7741-A` → **Bind device to my account** → **Continue to jobs**.

**0:30 — Jobs (30 s)**
Four jobs. Open **JOB-2026-0147 (MV Clyde Venture)** to show the zero-assessment empty state, then
back. Open **JOB-2026-0142 (MV Northern Trader)** to show a job with a mixed set of records.
*Leave the app on the Jobs screen for ~20 s at some point and a simulated push notification arrives
that deep-links into a completed assessment.*

**1:00 — Capture flow (90 s)**
From JOB-2026-0142 tap **New assessment** → note the "Simulated camera" caveat → **Start capture
set**.
- Step 1 Front elevation → shutter → quality metrics all pass → **Use this frame**
- Step 2 Side elevation → shutter → **Use this frame**
- **Step 3 45° corner → shutter → this frame always fails on device tilt (7.8° against a 5.0° limit)**
  with the specific failing metric and a retake prompt → **Retake frame** → passes → **Use this frame**
- Step 4 Label close-up → shutter → **Use this frame**
- Capture-set review: four thumbnails, retake and discard per frame → **Submit for assessment**
- Chunked upload runs to 100 % over ~2 s per frame. **Tap the connectivity tab on the left edge of
  the screen mid-upload** — the transfer pauses at the chunk boundary and shows "Transfer paused";
  tap again and it resumes from where it stopped.

**2:30 — Processing and result (60 s)**
The staged pipeline runs through Detection → Segmentation → Dimension computation → Classification →
Label OCR → Weight resolution → Confidence scoring, about 8 s, polling a mock status endpoint every
second. It lands on the assessment result:
- Every field carries a 0–100 confidence badge, a source badge and an uncertainty range
- **Weight** shows the precedence chain: label read used, with catalogue and density × volume shown
  as the available fallbacks
- Tap the pencil on **Height** → override sheet → pick a reason from the preset list, add free text →
  **Save override**. The field is stamped *Overridden by Daniel Okafor* and the audit trail grows.
- **Confirm assessment**

**3:30 — Lifting assistance (60 s)**
**Continue to lifting assistance**:
- Gross weight breakdown: cargo + rigging accessories + 10 % contingency
- Suggested rigging for the detected cargo type, drawn from the rigging registry, editable via
  **Change**
- Sling angle diagram with the angle factor and load per leg — drag the angle down to **30°** to see
  the leg load spike and the critical advisory fire
- Lifting-point flag, centre-of-gravity offset warning and the irregular-load flags
- Crane capacity bar against the load chart. **Drag the working radius out to ~46 m** — utilisation
  crosses 85 % and the bar turns red with an approval warning.
- **Build lift summary**

**4:30 — Output and handover (30 s)**
The lift summary is laid out to mirror a physical lifting permit.
- **Export PDF permit** — generates a real client-side PDF with the summary fields and capture
  thumbnails, and downloads it
- **Copy text** — puts the formatted permit text on the clipboard
- **Share** — simulated handover destinations, each recorded on the audit trail
- **Verify and lock record** — status flips Estimated → Verified, the version is stamped and every
  field becomes read-only, with **Re-open and re-assess** available to create version 2

### Worth showing if you have longer

| Feature | Where |
|---|---|
| **Low confidence forces manual entry** | History → `ASMT-2026-0309` (mixed pallet). Three fields below 70. The record cannot be confirmed until each is entered by hand. |
| **Processing failure and retry** | History → `ASMT-2026-0307`. Fails at the Label OCR stage with `OCR_LOW_CONTRAST`. Two recovery paths: retake the label frame and retry (succeeds, weight from label), or retry without the label (succeeds with a low-confidence density-derived weight). |
| **Offline queue and conflict resolution** | Tap the connectivity tab to go offline, capture a set → it is held in the device queue. Go back online → **Sync queue** → **Send items**. The queue drains one item at a time and the second item raises a conflict prompt (device 1 250 kg vs server 1 268 kg) — choose which value survives; the other is recorded on the audit trail. |
| **Confidence threshold is configurable** | Profile → Assessment settings → drag the manual-entry threshold to 90. More records now show low-confidence fields; the gate applies immediately. |
| **Contingency percentage** | Same screen. Change contingency from 10 % to 20 % and reopen a lift summary — the gross weight and utilisation move. |
| **Force-update gate** | Profile → Assessment settings → **Force minimum-version gate**. A blocking modal covers the app until dismissed. |
| **Full audit trail** | History → any record → full audit trail with actor, timestamp, version, before/after values and override reasons. |
| **Notification preferences** | Profile → Notification preferences. Switch a category off and it disappears from the notifications list. |
| **Delete account** | Profile → Delete account. Two-step confirm: acknowledge consequences, then type `DELETE`, then a final confirm sheet. |

---

## Seeded data

`src/data/` holds every fixture.

- **`users.ts`** — one logged-in Lifting Supervisor plus two users for audit attribution.
- **`jobs.ts`** — 4 jobs. `JOB-2026-0147` deliberately has zero assessments.
- **`assessments.ts`** — 10 records covering every state:

  | Reference | State | Shows |
  |---|---|---|
  | `ASMT-2026-0311` | Verified and locked, v2 | Version stamping after a re-assessment |
  | `ASMT-2026-0310` | Completed, high confidence | Clean happy path |
  | `ASMT-2026-0309` | Completed, low confidence | Three fields below threshold → manual entry |
  | `ASMT-2026-0308` | Overridden | Two overrides with reasons on the audit trail |
  | `ASMT-2026-0307` | Failed | OCR failure with two retry paths |
  | `ASMT-2026-0306` | Processing | Pipeline in flight |
  | `ASMT-2026-0305` | Verified and locked, v1 | Approved lift plan |
  | `ASMT-2026-0304` | Completed, high confidence | Certified lifting points |
  | `ASMT-2026-0303` | Queued offline | Held in the device queue |
  | `ASMT-2026-0302` | Completed, low confidence | Irregular load, no label frame, all four flags |

- **`cargoCatalogue.ts`** — 20 cargo types with material, packed density, standard packaging and a
  nominal weight range: pallets, steel plate, pipe bundles, crated machinery, drums, IBC tanks,
  bulk bags, cable reels, transformer skids and irregular fabrications.
- **`riggingRegistry.ts`** — 9 slings, 6 shackles, 7 spreaders and beams, plus one suggestion rule
  per cargo family with a written rationale.
- **`craneLoadCharts.ts`** — Liebherr LHM 550 (mobile harbour), Demag CC 2800-1 (crawler) and
  Potain MDT 389 (tower), each with boom configurations and radius-vs-capacity tables. Capacities
  between chart rows are linearly interpolated.
- **`notifications.ts`** — 5 notifications across all categories, plus the simulated inbound push.
- **`images.ts`** — every capture "photograph" is generated here as inline SVG. Nothing is fetched.

---

## How the simulation is kept repeatable

Everything is a pure function of seeded inputs, so the same click path produces the same numbers
every time.

- **Quality gate** (`src/lib/qualityGate.ts`) — the outcome is a function of `(step, attempt)`. The
  45° corner frame fails for tilt on attempt 1 and passes on the retake. Every other frame passes.
- **Pipeline progress** (`src/services/mock/inference.ts`) — stage states are derived from elapsed
  time since submission, so the status endpoint can be polled once a second and a mid-run reload
  picks up where it left off. Total run is ~8.0 s across seven stages.
- **Inference results** — three live capture scenarios cycle in a fixed order: (1) Euro pallet, all
  fields high confidence; (2) crated machinery with an illegible weight stencil, which drops the
  weight to 57 and forces the manual-entry route; (3) steel plate pack, high confidence. The seeded
  OCR failure has its own two retry results.
- **Upload** — fixed per-frame byte sizes and 20 chunks of 100 ms per frame.

---

## Project structure

```
src/
  components/     Button, Badge, Sheet, ProgressBar, ConfidenceBadge, FieldRow,
                  WeightChain, SlingDiagram, AppShell, TabBar, StatusStrip, ToastHost…
  screens/
    access/       splash, login, forgot/reset password, device registration
    jobs/         list, detail, create
    capture/      job picker, brief, camera viewport, capture-set review
    assessment/   processing, result, manual entry, lifting assistance, permit, audit trail
    history/      list with search/sort/filter, detail with captures and full audit
    notifications/
    profile/      profile, edit, settings, notification preferences, terms, privacy, delete
    sync/         offline queue and conflict resolution
  services/mock/  client (latency, offline), session, upload, inference, sync
  store/          Zustand store with localStorage persistence
  data/           all fixtures
  lib/            confidence, quality gate, lifting calculations, PDF, permit text, formatting
```

---

## What is real and what is faked

**Real, client-side:** all navigation and state; localStorage persistence; the confidence threshold
gate; override capture with reason and audit stamping; version stamping and record locking; the
lifting arithmetic (gross weight, angle factor, load per leg, load-chart interpolation, utilisation);
PDF generation; clipboard copy; search, sort and filtering.

**Simulated:** the camera and every capture image; the quality gate; upload progress; the inference
pipeline and all model outputs; OCR; connectivity and the offline queue; push notifications; the
minimum-version gate; share destinations; account deletion.

---

## Known limits

- The camera is not functional — see the caveat at the top.
- Sling-angle geometry uses a conservative two-leg share for a four-leg set. It is a demo
  calculation, not a substitute for a lift plan.
- Load chart figures are indicative and abridged; they are not the manufacturer charts.
- Gallery import does not open a real file picker; it produces the same seeded frame as the shutter,
  marked as imported.
