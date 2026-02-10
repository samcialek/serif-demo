import { forwardRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/utils/classNames'
import {
  Home,
  Building2,
  Link2,
  Lightbulb,
  ListChecks,
  Users,
  Code,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react'

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

const navItems = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/clients', icon: Building2, label: 'Clients' },
  { to: '/data', icon: Database, label: 'Data' },
  { to: '/integration', icon: Link2, label: 'Devices' },
  { to: '/insights', icon: Lightbulb, label: 'Insights' },
  { to: '/protocols', icon: ListChecks, label: 'Protocols' },
  { to: '/coach', icon: Users, label: 'Coach' },
  { to: '/api', icon: Code, label: 'API' },
  { to: '/admin', icon: Settings, label: 'Settings' },
]

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    const location = useLocation()

    return (
      <aside
        ref={ref}
        className={cn(
          // CLINICAL PRECISION: Clean, subtle, professional
          'w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0',
          className
        )}
        {...props}
      >
        {/* Logo - Clinical Precision with Serif branding */}
        <div className="h-24 flex items-center px-5 border-b border-slate-100">
          <NavLink to="/" className="flex items-center gap-3">
            <img
              src="/serif-demo/serif_logo-removebg-preview.png"
              alt="Serif"
              className="w-[72px] h-[72px] object-contain"
            />
            <span className="font-semibold text-xl text-slate-800 tracking-tight">Serif</span>
          </NavLink>
        </div>

        {/* Navigation - Clinical Precision */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to)

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={cn(
                      // Clinical Precision: Subtle, rounded, soft transitions
                      'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg',
                      'transition-all duration-200',
                      isActive
                        ? 'bg-primary-50 text-primary-600 border-l-2 border-l-serif-cyan'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-l-transparent'
                    )}
                  >
                    <Icon className={cn(
                      'w-[18px] h-[18px]',
                      isActive ? 'text-primary-500' : 'text-slate-400'
                    )} />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Subtle footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
            Personalized Health Intelligence
          </p>
        </div>
      </aside>
    )
  }
)

Sidebar.displayName = 'Sidebar'

// Collapsible Sidebar variant - Clinical Precision
export interface CollapsibleSidebarProps extends SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export const CollapsibleSidebar = forwardRef<HTMLElement, CollapsibleSidebarProps>(
  ({ className, isCollapsed = false, onToggle, ...props }, ref) => {
    const location = useLocation()

    return (
      <aside
        ref={ref}
        className={cn(
          // Clinical Precision: Clean, subtle
          'bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0',
          'transition-all duration-200',
          isCollapsed ? 'w-[72px]' : 'w-64',
          className
        )}
        {...props}
      >
        {/* Logo */}
        <div className="h-24 flex items-center justify-between px-3 border-b border-slate-100">
          <NavLink to="/" className="flex items-center gap-2">
            <img
              src="/serif-demo/serif_logo-removebg-preview.png"
              alt="Serif"
              className="w-[72px] h-[72px] object-contain flex-shrink-0"
            />
            {!isCollapsed && (
              <span className="font-semibold text-lg text-slate-800 tracking-tight">Serif</span>
            )}
          </NavLink>
          <button
            onClick={onToggle}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to)

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'transition-all duration-200',
                      isCollapsed && 'justify-center',
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn(
                      'w-[18px] h-[18px] flex-shrink-0',
                      isActive ? 'text-primary-500' : 'text-slate-400'
                    )} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    )
  }
)

CollapsibleSidebar.displayName = 'CollapsibleSidebar'

export default Sidebar


