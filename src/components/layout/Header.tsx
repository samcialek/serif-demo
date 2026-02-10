import { forwardRef } from 'react'
import { cn, transitions } from '@/utils/classNames'
import { RefreshCw, Bell, ChevronDown } from 'lucide-react'
import { useDemoStore } from '@/stores/demoStore'
import { usePersona } from '@/hooks'
import { useSyncStatus, useTimeSinceSync } from '@/hooks/useSyncStatus'
import { Tooltip } from '@/components/common'

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {}

export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className, ...props }, ref) => {
    const { guidedMode } = useDemoStore()
    const { activePersona, personas, setPersona } = usePersona()
    const { isSyncing, simulateSync } = useSyncStatus()
    const timeSinceSync = useTimeSinceSync()

    return (
      <header
        ref={ref}
        className={cn(
          'h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6',
          className
        )}
        {...props}
      >
        {/* Left side - Persona selector - Clinical Precision */}
        <div className="flex items-center gap-4">
          <div className="relative" data-tour="persona-selector">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Viewing as</label>
            <div className="relative">
              <select
                value={activePersona?.id || ''}
                onChange={(e) => setPersona(e.target.value)}
                className={cn(
                  'appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5',
                  'text-sm font-medium text-slate-700',
                  transitions.colors,
                  'hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300'
                )}
              >
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} ({persona.dataContext?.daysOfData ?? persona.daysOfData}d)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Persona context badge - Clinical Precision */}
          {activePersona && (
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full font-medium text-slate-600">
                {activePersona.dataContext?.daysOfData ?? activePersona.daysOfData} Days
              </span>
              <span className="px-2.5 py-1 bg-primary-50 border border-primary-100 rounded-full font-medium text-primary-600">
                {Math.round((activePersona.dataContext?.evidenceWeight ?? 0.7) * 100)}% Personal
              </span>
            </div>
          )}
        </div>

        {/* Right side - Actions - Clinical Precision */}
        <div className="flex items-center gap-3">
          {/* Guided mode indicator */}
          {guidedMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-full">
              <span className="w-2 h-2 bg-serif-cyan rounded-full animate-pulse" />
              Tour Active
            </div>
          )}

          {/* Sync button - Clinical Precision */}
          <Tooltip content={`Last synced: ${timeSinceSync}`}>
            <button
              onClick={simulateSync}
              disabled={isSyncing}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600',
                transitions.colors,
                'hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          </Tooltip>

          {/* Notifications - Clinical Precision */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-serif-pink rounded-full" />
          </button>

          {/* User avatar - Clinical Precision */}
          <div className="w-8 h-8 bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-semibold rounded-full">
            {activePersona?.name.charAt(0) || 'U'}
          </div>
        </div>
      </header>
    )
  }
)

Header.displayName = 'Header'

// Sub-header for page-level navigation - Clinical Precision
export interface SubHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs?: { value: string; label: string; count?: number }[]
  activeTab?: string
  onTabChange?: (value: string) => void
  actions?: React.ReactNode
}

export const SubHeader = forwardRef<HTMLDivElement, SubHeaderProps>(
  ({ className, tabs, activeTab, onTabChange, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border-b border-slate-200 px-6 flex items-center justify-between',
          className
        )}
        {...props}
      >
        {/* Tabs - Clinical Precision */}
        {tabs && (
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange?.(tab.value)}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.value
                    ? 'text-primary-600 border-serif-cyan'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'ml-2 px-1.5 py-0.5 text-xs rounded-full',
                      activeTab === tab.value
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    )
  }
)

SubHeader.displayName = 'SubHeader'

// Breadcrumbs
export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
}

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items, ...props }, ref) => {
    return (
      <nav ref={ref} className={cn('flex items-center text-sm', className)} {...props}>
        {items.map((item, index) => (
          <span key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-slate-300">/</span>
            )}
            {item.href ? (
              <a
                href={item.href}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-slate-800 font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    )
  }
)

Breadcrumbs.displayName = 'Breadcrumbs'

export default Header
