import { CURRENT_USER } from '@/data/users'
import type { User } from '@/types'
import { latency } from './client'

export interface LoginResult {
  ok: boolean
  user?: User
  error?: string
}

export async function login(email: string, password: string): Promise<LoginResult> {
  await latency(900, 1400)
  const e = email.trim().toLowerCase()
  if (!e || !password) return { ok: false, error: 'Enter your email and password.' }
  if (e !== CURRENT_USER.email.toLowerCase()) {
    return { ok: false, error: 'No NGT account found for that email address.' }
  }
  if (password !== CURRENT_USER.password) {
    return { ok: false, error: 'Incorrect password. Check caps lock and try again.' }
  }
  const { password: _pw, ...safe } = CURRENT_USER
  return { ok: true, user: safe as User }
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  await latency(900, 1500)
  if (!email.includes('@')) return { ok: false, error: 'Enter a valid email address.' }
  return { ok: true }
}

export async function confirmPasswordReset(pw: string, confirm: string): Promise<{ ok: boolean; error?: string }> {
  await latency(800, 1200)
  if (pw.length < 10) return { ok: false, error: 'Password must be at least 10 characters.' }
  if (pw !== confirm) return { ok: false, error: 'Passwords do not match.' }
  return { ok: true }
}

export async function registerDevice(deviceId: string): Promise<{ ok: boolean; registeredAt: string; deviceId: string }> {
  await latency(1400, 2200)
  return { ok: true, registeredAt: new Date().toISOString(), deviceId }
}

export async function deleteAccount(): Promise<{ ok: boolean }> {
  await latency(1200, 1800)
  return { ok: true }
}
