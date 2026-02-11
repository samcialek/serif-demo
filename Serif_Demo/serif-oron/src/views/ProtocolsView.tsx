import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Moon,
  Activity,
  Heart,
  Shield,
  UtensilsCrossed,
  Calendar,
  ChevronRight,
  Clock,
  FlaskConical,
  AlertTriangle,
  CheckCircle,
  Info,
  Dumbbell,
  Bike,
  Footprints,
} from 'lucide-react'
import { PageLayout, Grid } from '@/components/layout'
import { Card } from '@/components/common'
import {
  derivedProtocols,
  weeklyPlan,
  weeklySummary,
  type DerivedProtocol,
  type DailyProtocol,
  type ConflictResolution,
} from '@/data/oronProtocols'

// ============================================================================
// TAB DEFINITIONS
// ============================================================================

type ViewTab = 'daily' | 'weekly' | 'protocols'

const TABS: { id: ViewTab; label: string }[] = [
  { id: 'daily', label: "Today's Plan" },
  { id: 'weekly', label: 'Weekly View' },
  { id: 'protocols', label: 'All Protocols' },
]

// ============================================================================
// CATEGORY COLORS & ICONS
// ============================================================================

const CATEGORY_CONFIG: Record<
  string,
  { color: string; bgColor: string; borderColor: string; icon: React.ElementType }
> = {
  sleep: { color: '#b8aadd', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', icon: Moon },
  training: { color: '#5ba8d4', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: Activity },
  recovery: { color: '#e99bbe', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', icon: Heart },
  nutrition: { color: '#f59e0b', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: UtensilsCrossed },
}

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  high: { label: 'High Confidence', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  medium: { label: 'Medium Confidence', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  low: { label: 'Low Confidence', color: 'text-slate-600', bgColor: 'bg-slate-100' },
}

const DAY_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  hard: { label: 'Hard', color: 'text-rose-700', bgColor: 'bg-rose-50', icon: Dumbbell },
  moderate: { label: 'Moderate', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: Bike },
  easy: { label: 'Easy', color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: Footprints },
  rest: { label: 'Rest', color: 'text-slate-600', bgColor: 'bg-slate-100', icon: Moon },
}

// ============================================================================
// DAILY VIEW — Today's protocol with morning/afternoon/evening blocks
// ============================================================================

function DailyView({ day }: { day: DailyProtocol }) {
  const dayType = DAY_TYPE_CONFIG[day.dayType]
  const DayIcon = dayType.icon

  return (
    <div className="space-y-6">
      {/* Day Header */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-800">
                {day.dayOfWeek}, {formatDate(day.date)}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${dayType.color} ${dayType.bgColor}`}
              >
                <DayIcon className="w-3 h-3" />
                {dayType.label} Day
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Sleep target: {day.sleepTarget.duration}h ({day.sleepTarget.bedtime} →{' '}
              {day.sleepTarget.wakeTime})
              {day.trainingTarget
                ? ` | Training: ${day.trainingTarget.type} (${day.trainingTarget.duration} min)`
                : ' | No training scheduled'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">Updated now</span>
          </div>
        </div>
      </Card>

      {/* Schedule Blocks */}
      <div className="grid grid-cols-3 gap-4">
        <ScheduleBlockCard title="Morning" items={day.morningBlock} accent="#5ba8d4" />
        <ScheduleBlockCard title="Afternoon" items={day.afternoonBlock} accent="#f59e0b" />
        <ScheduleBlockCard title="Evening" items={day.eveningBlock} accent="#b8aadd" />
      </div>

      {/* Training Detail */}
      {day.trainingTarget && (
        <Card padding="none" className="overflow-hidden">
          <div
            className="px-5 py-3 border-b"
            style={{ backgroundColor: '#5ba8d418', borderColor: '#5ba8d440' }}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: '#5ba8d4' }} />
              <span className="text-sm font-semibold text-slate-800">Training Detail</span>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Type</div>
                <div className="text-sm font-semibold font-mono text-slate-800">
                  {day.trainingTarget.type}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Duration</div>
                <div className="text-sm font-semibold font-mono text-slate-800">
                  {day.trainingTarget.duration} min
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Intensity
                </div>
                <div className="text-sm font-semibold font-mono text-slate-800">
                  {day.trainingTarget.intensity}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Window</div>
                <div className="text-sm font-semibold font-mono text-slate-800">
                  {day.trainingTarget.window}
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600">{day.trainingTarget.notes}</p>
          </div>
        </Card>
      )}

      {/* Recovery & Nutrition Notes */}
      <div className="grid grid-cols-2 gap-4">
        <NotesCard
          title="Recovery Notes"
          items={day.recoveryNotes}
          icon={<Heart className="w-4 h-4" style={{ color: '#e99bbe' }} />}
          accent="#e99bbe"
        />
        <NotesCard
          title="Nutrition Notes"
          items={day.nutritionNotes}
          icon={<UtensilsCrossed className="w-4 h-4" style={{ color: '#f59e0b' }} />}
          accent="#f59e0b"
        />
      </div>
    </div>
  )
}

function ScheduleBlockCard({
  title,
  items,
  accent,
}: {
  title: string
  items: DailyProtocol['morningBlock']
  accent: string
}) {
  const BLOCK_CATEGORY_COLORS: Record<string, string> = {
    sleep: '#b8aadd',
    training: '#5ba8d4',
    recovery: '#e99bbe',
    nutrition: '#f59e0b',
    routine: '#94a3b8',
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div
        className="px-4 py-2.5 border-b"
        style={{ backgroundColor: accent + '12', borderColor: accent + '30' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
          {title}
        </span>
      </div>
      <div className="p-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div
              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ backgroundColor: BLOCK_CATEGORY_COLORS[item.category] ?? '#94a3b8' }}
            />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                  {item.time}
                </span>
                <span className="text-xs font-medium text-slate-700">{item.action}</span>
              </div>
              {item.detail && (
                <p className="text-[10px] text-slate-400 mt-0.5">{item.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function NotesCard({
  title,
  items,
  icon,
  accent,
}: {
  title: string
  items: string[]
  icon: React.ReactNode
  accent: string
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div
        className="px-4 py-2.5 border-b flex items-center gap-2"
        style={{ backgroundColor: accent + '12', borderColor: accent + '30' }}
      >
        {icon}
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>
      <div className="p-4">
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <ChevronRight
                className="w-3 h-3 mt-0.5 flex-shrink-0"
                style={{ color: accent }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

// ============================================================================
// WEEKLY VIEW — 7-day training plan overview
// ============================================================================

function WeeklyView() {
  return (
    <div className="space-y-6">
      {/* Weekly Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryStatCard
          label="Total Training"
          value={`${weeklySummary.totalTrainingMin}`}
          unit="min"
          detail={`${weeklySummary.hardDays} hard, ${weeklySummary.easyDays} easy, ${weeklySummary.moderateDays} moderate, ${weeklySummary.restDays} rest`}
        />
        <SummaryStatCard
          label="Zone 2 Volume"
          value={`${weeklySummary.totalZone2Min}`}
          unit="min/wk"
          detail={`${weeklySummary.Zone2Pct}% of training is Zone 2`}
        />
        <SummaryStatCard
          label="Running Volume"
          value={`${weeklySummary.totalRunKm}`}
          unit="km"
          detail="Capped at 35 km/wk for iron protection"
        />
        <SummaryStatCard
          label="Est. ACWR"
          value={`${weeklySummary.estimatedACWR}`}
          unit="ratio"
          detail="Target: 0.8–1.2 (from 0.93 current)"
        />
      </div>

      {/* Day-by-day grid */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">7-Day Training Plan</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {weeklyPlan.map((day) => {
            const dayType = DAY_TYPE_CONFIG[day.dayType]
            const DayIcon = dayType.icon
            return (
              <div
                key={day.date}
                className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
              >
                {/* Day + date */}
                <div className="w-32 flex-shrink-0">
                  <div className="text-sm font-medium text-slate-800">{day.dayOfWeek}</div>
                  <div className="text-[10px] text-slate-400">{formatDate(day.date)}</div>
                </div>

                {/* Day type badge */}
                <div className="w-24 flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${dayType.color} ${dayType.bgColor}`}
                  >
                    <DayIcon className="w-2.5 h-2.5" />
                    {dayType.label}
                  </span>
                </div>

                {/* Training info */}
                <div className="flex-1 min-w-0">
                  {day.trainingTarget ? (
                    <div>
                      <span className="text-sm font-medium text-slate-700">
                        {day.trainingTarget.type}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {day.trainingTarget.duration} min | {day.trainingTarget.zone} |{' '}
                        {day.trainingTarget.window}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Rest — mobility only</span>
                  )}
                </div>

                {/* Sleep target */}
                <div className="w-28 flex-shrink-0 text-right">
                  <div className="text-xs text-slate-400">Sleep</div>
                  <div className="text-sm font-mono font-medium text-slate-700">
                    {day.sleepTarget.duration}h
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Zone distribution visual */}
      <Card padding="md">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-3">
          Weekly Load Distribution
        </div>
        <div className="flex items-center gap-2 mb-2">
          {weeklyPlan.map((day) => {
            const dt = DAY_TYPE_CONFIG[day.dayType]
            const heightMap: Record<string, string> = {
              hard: 'h-20',
              moderate: 'h-14',
              easy: 'h-10',
              rest: 'h-4',
            }
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-md ${heightMap[day.dayType]} ${dt.bgColor}`}
                  style={{ borderBottom: `3px solid ${CATEGORY_CONFIG.training.color}` }}
                />
                <span className="text-[9px] text-slate-400">
                  {day.dayOfWeek.slice(0, 3)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {Object.entries(DAY_TYPE_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1 text-[9px] text-slate-400">
              <span className={`inline-block w-2 h-2 rounded-sm ${cfg.bgColor}`} />
              {cfg.label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SummaryStatCard({
  label,
  value,
  unit,
  detail,
}: {
  label: string
  value: string
  unit: string
  detail: string
}) {
  return (
    <Card padding="sm">
      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline mt-1">
        <span className="text-xl font-semibold font-mono text-slate-800">{value}</span>
        <span className="text-xs text-slate-400 ml-1">{unit}</span>
      </div>
      <div className="text-[10px] text-slate-400 mt-1">{detail}</div>
    </Card>
  )
}

// ============================================================================
// PROTOCOLS VIEW — All derived protocols with source insight tracing
// ============================================================================

function AllProtocolsView() {
  const grouped = {
    sleep: derivedProtocols.filter((p) => p.category === 'sleep'),
    training: derivedProtocols.filter((p) => p.category === 'training'),
    recovery: derivedProtocols.filter((p) => p.category === 'recovery'),
    nutrition: derivedProtocols.filter((p) => p.category === 'nutrition'),
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, protocols]) => {
        if (protocols.length === 0) return null
        const config = CATEGORY_CONFIG[category]
        const CatIcon = config.icon
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="p-1.5 rounded-md"
                style={{ backgroundColor: config.color + '18' }}
              >
                <CatIcon className="w-4 h-4" style={{ color: config.color }} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                {category} Protocols
              </h3>
              <span className="text-xs text-slate-400">({protocols.length})</span>
            </div>
            <div className="space-y-4">
              {protocols.map((protocol) => (
                <ProtocolCard key={protocol.id} protocol={protocol} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProtocolCard({ protocol }: { protocol: DerivedProtocol }) {
  const [expanded, setExpanded] = useState(false)
  const config = CATEGORY_CONFIG[protocol.category]
  const confidenceConfig = CONFIDENCE_CONFIG[protocol.confidence]

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-3 border-b cursor-pointer"
        style={{ backgroundColor: config.color + '08', borderColor: config.color + '20' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-slate-800">
                {protocol.recommendation}
              </h4>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${confidenceConfig.color} ${confidenceConfig.bgColor}`}
              >
                {confidenceConfig.label}
              </span>
              <span className="text-[10px] text-slate-400">
                Target: {protocol.target.value} {protocol.target.unit}
                {protocol.target.range && (
                  <> (range: {protocol.target.range[0]}–{protocol.target.range[1]})</>
                )}
              </span>
              <span className="text-[10px] text-slate-400">
                {protocol.sourceInsights.length} source insight
                {protocol.sourceInsights.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 mt-1 ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.15 }}
        >
          {/* Reasoning */}
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-600 leading-relaxed">{protocol.reasoning}</p>
            </div>
          </div>

          {/* Source Insights */}
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
              Source Insights
            </div>
            <div className="space-y-2">
              {protocol.sourceInsights.map((si) => (
                <div
                  key={si.insightId}
                  className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-slate-700">{si.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{si.insightId}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{si.contribution}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                      <span>
                        Threshold: {si.theta} {si.thetaUnit}
                      </span>
                      <span>|</span>
                      <span>Personal weight: {(si.personalWeight * 100).toFixed(0)}%</span>
                      <span>|</span>
                      <span>{si.observations.toLocaleString()} observations</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conflict Resolution */}
          {protocol.conflictResolution && (
            <ConflictResolutionCard resolution={protocol.conflictResolution} />
          )}
        </motion.div>
      )}
    </Card>
  )
}

function ConflictResolutionCard({ resolution }: { resolution: ConflictResolution }) {
  return (
    <div className="px-5 py-3 bg-amber-50/40 border-t border-amber-100/50">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
          Conflict Resolution
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-3">{resolution.description}</p>

      {/* Competing insights */}
      <div className="space-y-1.5 mb-3">
        {resolution.insights.map((ins) => {
          const isWinner = ins.id === resolution.winner
          return (
            <div
              key={ins.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs ${
                isWinner
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-white border border-slate-200'
              }`}
            >
              {isWinner ? (
                <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" />
              )}
              <span className={`font-medium ${isWinner ? 'text-emerald-800' : 'text-slate-700'}`}>
                {ins.title}
              </span>
              <span className="text-slate-400 ml-auto">suggests {ins.suggests}</span>
              <span className="text-[10px] text-slate-400">
                ({(ins.weight * 100).toFixed(0)}% personal)
              </span>
            </div>
          )
        })}
      </div>

      {/* Resolution rule */}
      <div className="flex items-start gap-2 px-2.5 py-2 bg-white rounded-md border border-slate-200">
        <Shield className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
        <span className="text-[10px] text-slate-500">
          <strong className="text-slate-600">Rule applied:</strong> {resolution.rule}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ============================================================================
// MAIN VIEW
// ============================================================================

export function ProtocolsView() {
  const [activeTab, setActiveTab] = useState<ViewTab>('daily')
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)

  const today = weeklyPlan[selectedDayIdx]

  return (
    <PageLayout
      title="Synthesized Protocols"
      subtitle="Actionable daily protocols derived from Oron's 20 Bayesian insights — conflicts resolved, sources traced"
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-slate-800 border-slate-800'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* Daily view */}
        {activeTab === 'daily' && (
          <div>
            {/* Day selector */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto">
              {weeklyPlan.map((day, idx) => {
                const isSelected = idx === selectedDayIdx
                const dt = DAY_TYPE_CONFIG[day.dayType]
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-white border border-slate-200 shadow-sm text-slate-800'
                        : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div>{day.dayOfWeek.slice(0, 3)}</div>
                    <div className={`text-[9px] mt-0.5 ${dt.color}`}>{dt.label}</div>
                  </button>
                )
              })}
            </div>
            <DailyView day={today} />
          </div>
        )}

        {/* Weekly view */}
        {activeTab === 'weekly' && <WeeklyView />}

        {/* All protocols */}
        {activeTab === 'protocols' && <AllProtocolsView />}
      </motion.div>
    </PageLayout>
  )
}

export default ProtocolsView
