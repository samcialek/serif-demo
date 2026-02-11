import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'
import { Card } from '@/components/common'
import { cn } from '@/utils/classNames'
import { getLongevityInsights, STATUS_CONFIG, type LongevityInsight, type InsightStatus } from '@/data/insights/longevityInsights'

// Faint background tints matching severity designation
const STATUS_BG_TINT: Record<InsightStatus, string> = {
  critical: 'bg-red-50/60',
  warning: 'bg-orange-50/60',
  watch: 'bg-yellow-50/50',
  optimal: 'bg-green-50/50',
}

interface LongevityInsightsCardProps {
  personaId: string
}

function StatusBadge({ status }: { status: InsightStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold uppercase tracking-wide"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  )
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (!trend) return null
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const color = trend === 'up' ? '#DC2626' : trend === 'down' ? '#2563EB' : '#6B7280'
  return <Icon className="w-4 h-4" style={{ color }} />
}

function InsightRow({ insight, index }: { insight: LongevityInsight; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border-b-2 border-gray-100 last:border-b-0"
    >
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1">
            <StatusBadge status={insight.status} />
            <h4 className="text-base font-black text-black uppercase tracking-tight mt-2">
              {insight.headline}
            </h4>
          </div>
          {insight.metric && (
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className="text-2xl font-black text-black">{insight.metric.value}</span>
                <TrendIcon trend={insight.metric.trend} />
              </div>
              <span className="text-xs text-gray-500">{insight.metric.label}</span>
            </div>
          )}
        </div>

        {/* Explanation */}
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {insight.explanation}
        </p>

        {/* Data Sources */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-400 uppercase">Sources:</span>
          {insight.dataSources.map((source, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-xs font-medium text-gray-600"
            >
              {source}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function LongevityInsightsCard({ personaId }: LongevityInsightsCardProps) {
  const insights = getLongevityInsights(personaId)

  // Sort by severity: critical > warning > watch > optimal
  const severityOrder: InsightStatus[] = ['critical', 'warning', 'watch', 'optimal']
  const sortedInsights = [...insights].sort(
    (a, b) => severityOrder.indexOf(a.status) - severityOrder.indexOf(b.status)
  )

  // Count by status
  const statusCounts = insights.reduce((acc, insight) => {
    acc[insight.status] = (acc[insight.status] || 0) + 1
    return acc
  }, {} as Record<InsightStatus, number>)

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header - BRUTALIST */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Longevity Insights</span>
            </div>
            <span className="text-xs font-medium opacity-80">What EHR Can't See</span>
          </div>
        </div>
      </div>

      {/* Insights 2x2 Grid */}
      <div className="grid grid-cols-2 gap-0">
        {sortedInsights.map((insight, index) => (
          <div key={insight.id} className={cn(
            STATUS_BG_TINT[insight.status],
            index % 2 === 0 ? 'border-r border-gray-200' : '',
            index < 2 ? 'border-b border-gray-200' : ''
          )}>
            <InsightRow insight={insight} index={index} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t-2 border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Cross-modal insights from wearables, CGM, and consumer health data • Updated in real-time
        </p>
      </div>
    </Card>
  )
}

export default LongevityInsightsCard
