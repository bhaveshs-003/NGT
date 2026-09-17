// ---------------------------------------------------------------------------
// Mock transport.
//
// There is no backend in this prototype. Every "request" resolves from the
// fixtures after a simulated delay, and fails deterministically when the demo
// offline toggle is on. Nothing here touches the network.
// ---------------------------------------------------------------------------

import { useApp } from '@/store/useApp'

export class MockNetworkError extends Error {
  code = 'OFFLINE'
  constructor(message = 'No terminal coverage. Request held on device.') {
    super(message)
    this.name = 'MockNetworkError'
  }
}

export function isOffline(): boolean {
  return useApp.getState().settings.offlineMode
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Latency band, jittered a little so progress never looks metronomic. */
export async function latency(min: number, max = min + 260): Promise<void> {
  await sleep(min + Math.random() * (max - min))
}

/** Wrap a fixture read in simulated latency, refusing while offline. */
export async function request<T>(
  fn: () => T | Promise<T>,
  opts: { ms?: number; allowOffline?: boolean } = {},
): Promise<T> {
  await latency(opts.ms ?? 420)
  if (!opts.allowOffline && isOffline()) throw new MockNetworkError()
  return fn()
}

