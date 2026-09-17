import { Camera, ClipboardList, History, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/jobs', label: 'Jobs', icon: ClipboardList },
  { to: '/capture', label: 'Capture', icon: Camera },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
]

export function TabBar() {
  return (
    <nav className="grid shrink-0 grid-cols-4 border-t border-steel-800 bg-steel-900 pb-[max(4px,env(safe-area-inset-bottom))]">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-amber-500' : 'text-steel-400 hover:text-steel-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
