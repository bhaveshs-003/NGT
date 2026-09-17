import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'

export function Splash() {
  const navigate = useNavigate()
  const authUser = useApp((s) => s.authUser)
  const deviceRegistered = useApp((s) => s.deviceRegistered)

  useEffect(() => {
    const t = setTimeout(() => {
      if (!authUser) navigate('/login', { replace: true })
      else if (!deviceRegistered) navigate('/device-registration', { replace: true })
      else navigate('/jobs', { replace: true })
    }, 1600)
    return () => clearTimeout(t)
  }, [authUser, deviceRegistered, navigate])

  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-steel-950 px-8">
      <div className="hazard-stripe absolute inset-x-0 top-0 h-1.5" />
      <NgtLogo />
      <h1 className="mt-6 text-center text-[20px] font-bold tracking-tight text-steel-100">Cargo Assessment</h1>
      <p className="mt-1.5 text-center text-[13px] leading-relaxed text-steel-400">
        AI-assisted cargo assessment and crane lifting assistance
      </p>
      <div className="mt-10 h-1 w-32 overflow-hidden rounded-full bg-steel-800">
        <div className="h-full w-1/3 animate-shimmer rounded-full bg-amber-500" />
      </div>
      <p className="absolute bottom-8 text-[11px] uppercase tracking-[0.18em] text-steel-600">
        NGT Lifting &amp; Cargo Services
      </p>
      <div className="hazard-stripe absolute inset-x-0 bottom-0 h-1.5" />
    </div>
  )
}

export function NgtLogo({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="NGT logo">
      <rect x="2" y="2" width="92" height="92" rx="18" fill="#0f141c" stroke="#2a3342" strokeWidth="2" />
      <path d="M22 68V30h9l21 26V30h9v38h-9L31 44v24z" fill="#ffb020" />
      <rect x="22" y="73" width="52" height="4" rx="2" fill="#ffb020" opacity="0.55" />
      <circle cx="74" cy="28" r="6" fill="#ffb020" opacity="0.9" />
    </svg>
  )
}
