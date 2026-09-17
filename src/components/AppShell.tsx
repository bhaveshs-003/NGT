import type { ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ForceUpdateGate, OfflineFab } from './DemoControls'
import { StatusStrip } from './StatusStrip'
import { TabBar } from './TabBar'
import { ToastHost } from './ToastHost'

/**
 * Phone-sized viewport. Fills the screen on a handset; on desktop it is
 * centred in a 390×844 frame against a neutral backdrop.
 */
/** Sheets and modals portal into this node so they cover the whole handset. */
export const PHONE_ROOT_ID = 'phone-root'

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center sm:p-6">
      <div
        id={PHONE_ROOT_ID}
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-steel-950 sm:h-[844px] sm:max-h-[calc(100dvh-48px)] sm:w-[390px] sm:rounded-[28px] sm:border sm:border-steel-700 sm:shadow-frame"
      >
        {children}
      </div>
    </div>
  )
}

/** Frame for the unauthenticated screens — no tab bar, no status strip. */
export function AccessShell() {
  return (
    <PhoneFrame>
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
      <ToastHost />
    </PhoneFrame>
  )
}

/** Routes that show the bottom tab bar and status strip. */
const CHROME_PREFIXES = ['/jobs', '/capture', '/history', '/profile', '/sync', '/assessment', '/notifications']

export function AppShell() {
  const { pathname } = useLocation()
  const showChrome = CHROME_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const isCaptureViewport = /^\/capture\/[^/]+\/step\//.test(pathname)
  const showTabs = showChrome && !isCaptureViewport
  const showStrip = showChrome && !isCaptureViewport

  return (
    <PhoneFrame>
      {showStrip && <StatusStrip />}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
      {showTabs && <TabBar />}
      {showChrome && <OfflineFab />}
      <ToastHost />
      <ForceUpdateGate />
    </PhoneFrame>
  )
}
