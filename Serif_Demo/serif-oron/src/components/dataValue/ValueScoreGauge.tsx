import { cn } from '@/utils/classNames'

interface ValueScoreGaugeProps {
  /** Primary count to display (e.g. new insights unlocked) */
  value: number
  /** Label shown below the number */
  label: string
  /** Total composite for progress arc (0-100) */
  progress: number
  size?: number // px
  tier: 'transformative' | 'high' | 'moderate' | 'low'
  className?: string
}

const tierColors = {
  transformative: { stroke: '#059669', bg: '#ecfdf5', text: 'text-emerald-700' },
  high: { stroke: '#2563eb', bg: '#eff6ff', text: 'text-blue-700' },
  moderate: { stroke: '#d97706', bg: '#fffbeb', text: 'text-amber-700' },
  low: { stroke: '#9ca3af', bg: '#f9fafb', text: 'text-gray-500' },
}

export function ValueScoreGauge({ value, label, progress, size = 80, tier, className }: ValueScoreGaugeProps) {
  const colors = tierColors[tier]
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, progress))
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={4}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-lg font-bold leading-none', colors.text)}>+{value}</span>
        </div>
      </div>
      <span className={cn('text-[10px] font-medium mt-1 leading-none', colors.text)}>{label}</span>
    </div>
  )
}
