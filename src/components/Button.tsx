import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
type Size = 'lg' | 'md' | 'sm'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-amber-500 text-steel-950 font-bold hover:bg-amber-400 active:bg-amber-600 disabled:bg-steel-700 disabled:text-steel-500',
  secondary:
    'bg-steel-800 text-steel-100 border border-steel-600 hover:bg-steel-700 active:bg-steel-850 disabled:text-steel-500 disabled:border-steel-700',
  ghost:
    'bg-transparent text-steel-300 border border-steel-700 hover:bg-steel-850 hover:text-steel-100 disabled:text-steel-600',
  danger:
    'bg-conf-low text-white font-bold hover:bg-red-600 active:bg-red-700 disabled:bg-steel-700 disabled:text-steel-500',
  quiet: 'bg-transparent text-amber-500 hover:text-amber-400 disabled:text-steel-600',
}

const SIZES: Record<Size, string> = {
  lg: 'min-h-[52px] px-5 text-[15px] rounded-xl',
  md: 'min-h-[48px] px-4 text-sm rounded-xl',
  sm: 'min-h-[38px] px-3 text-[13px] rounded-lg',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'lg',
  loading,
  block,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-colors duration-100 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
      <span className="truncate">{children}</span>
      {!loading && iconRight}
    </button>
  )
}

export function IconButton({
  label,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-steel-300 transition-colors hover:bg-steel-800 hover:text-steel-100 active:bg-steel-700 disabled:text-steel-600 ${className}`}
    >
      {children}
    </button>
  )
}
