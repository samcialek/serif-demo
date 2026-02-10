import { useState } from 'react'
import { motion } from 'framer-motion'
import { Filter, LayoutGrid, List, Sparkles, Clock, TrendingUp, TrendingDown, Minus, Target, Info, User, Calendar, Activity, Droplets, ChevronDown, SlidersHorizontal, Gauge, TestTube } from 'lucide-react'
import { PageLayout, Section, Grid } from '@/components/layout'
import { Card, Button, Toggle, Badge, Tooltip, PatientSelector, CertaintySlider } from '@/components/common'
import { InsightCard, InsightGrid } from '@/components/insights'
import { CertaintyIndicator, EvidenceWeight } from '@/components/charts'
import { useInsights, useInsightCategories, usePersona } from '@/hooks'
import { cn } from '@/utils/classNames'
import { INSIGHT_VARIABLE_TYPE_META } from '@/data/insights/types'
import type { InsightVariableType } from '@/types'

export function InsightsView() {
  const { activePersona } = usePersona()
  const {
    insights,
    allInsights,
    minCertainty,
    setMinCertainty,
    variableTypes,
    toggleVariableType,
    categories,
    toggleCategory,
    actionableOnly,
    setActionableOnly,
    totalCount,
    filteredCount,
    resetFilters,
    categoryStats,
  } = useInsights()

  const insightCategories = useInsightCategories()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  // Get category counts for filter
  const categoryCounts = categoryStats.reduce((acc, stat) => {
    acc[stat.category] = stat.count
    return acc
  }, {} as Record<string, number>)

  // Get variable type counts from ALL insights (not filtered)
  const variableTypeCounts = allInsights.reduce((acc, insight) => {
    const type = insight.variableType
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Get top insights for hero section
  const topInsights = insights.slice(0, 3)

  const handleInsightAction = (insightId: string, action: string) => {
    console.log('Insight action:', insightId, action)
  }

  // Variable type icons
  const variableTypeIcons: Record<InsightVariableType, React.ReactNode> = {
    outcome: <Target className="w-5 h-5" />,
    load: <TrendingUp className="w-5 h-5" />,
    marker: <Activity className="w-5 h-5" />,
  }

  // Category config for pills
  const categoryConfig: Record<string, { label: string; emoji: string }> = {
    sleep: { label: 'Sleep', emoji: '😴' },
    metabolic: { label: 'Metabolic', emoji: '🔥' },
    recovery: { label: 'Recovery', emoji: '💪' },
    cognitive: { label: 'Cognitive', emoji: '🧠' },
    cardio: { label: 'Cardio', emoji: '❤️' },
    activity: { label: 'Activity', emoji: '🏃' },
    stress: { label: 'Stress', emoji: '🧘' },
    nutrition: { label: 'Nutrition', emoji: '🥗' },
  }

  const hasActiveFilters = variableTypes.length > 0 || categories.length > 0 || minCertainty > 0

  return (
    <PageLayout
      title="Your Insights"
      subtitle="Personalized discoveries powered by causal AI"
      actions={
        <div className="flex items-center gap-3">
          <PatientSelector />
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 border-l border-slate-200 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    >
      {/* Persona Profile Card */}
      {activePersona && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card padding="none" className="overflow-hidden rounded-xl">
            <div className="px-6 py-3 bg-primary-50 border-b border-primary-100">
              <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">Active Profile</span>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={activePersona.avatar}
                    alt={activePersona.name}
                    className="w-24 h-24 object-cover rounded-xl border border-slate-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold text-slate-800">{activePersona.name}</h2>
                    <Badge variant="outline">{activePersona.age} YRS</Badge>
                  </div>
                  <p className="text-lg font-medium text-primary-600 mb-2">{activePersona.archetype}</p>
                  <p className="text-gray-600 mb-4">{activePersona.narrative}</p>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">{activePersona.daysOfData} Days</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <Activity className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">{activePersona.devices?.length || 0} Devices</span>
                    </div>
                    {activePersona.hasBloodwork && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg">
                        <Droplets className="w-4 h-4 text-rose-500" />
                        <span className="text-sm font-medium text-rose-700">{activePersona.labDraws} Lab Draws</span>
                      </div>
                    )}
                  </div>

                  {/* Active Loads & Biomarkers */}
                  {activePersona.loads && activePersona.loads.length > 0 && (() => {
                    const loads = activePersona.loads!.filter((l) => l.kind === 'load')
                    const markers = activePersona.loads!.filter((l) => l.kind === 'marker')
                    const statusColors = {
                      low: { bar: 'bg-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
                      moderate: { bar: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
                      high: { bar: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
                      critical: { bar: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
                    }
                    const renderCard = (item: typeof loads[number]) => {
                      const colors = statusColors[item.status]
                      const TrendIcon = item.trend === 'rising' ? TrendingUp : item.trend === 'falling' ? TrendingDown : Minus
                      const trendColor = item.trend === 'rising' ? 'text-red-500' : item.trend === 'falling' ? 'text-emerald-500' : 'text-slate-400'
                      return (
                        <Tooltip key={item.id} content={item.detail || item.label}>
                          <div className={cn('p-3 rounded-lg border', colors.bg, colors.border)}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-slate-700 truncate">{item.label}</span>
                              <TrendIcon className={cn('w-3.5 h-3.5 flex-shrink-0', trendColor)} />
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', colors.bar)}
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className={cn('text-xs font-medium', colors.text)}>{item.status}</span>
                              <span className="text-xs text-slate-400">{item.value}%</span>
                            </div>
                          </div>
                        </Tooltip>
                      )
                    }
                    return (
                      <div className="mt-5 pt-5 border-t border-slate-100 space-y-5">
                        {loads.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Gauge className="w-4 h-4 text-amber-500" />
                              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Loads</span>
                            </div>
                            <div className={cn('grid gap-3', loads.length === 1 ? 'grid-cols-1' : loads.length === 2 ? 'grid-cols-2' : loads.length === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
                              {loads.map(renderCard)}
                            </div>
                          </div>
                        )}
                        {markers.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <TestTube className="w-4 h-4 text-violet-500" />
                              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Biomarkers</span>
                            </div>
                            <div className={cn('grid gap-3', markers.length === 1 ? 'grid-cols-1' : markers.length === 2 ? 'grid-cols-2' : markers.length === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
                              {markers.map(renderCard)}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Variable Type Filter - Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="sticky top-0 z-20 -mx-6 px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-slate-200 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Filter by Variable Type</h3>
            <Tooltip content="COMPLE Framework: Filter insights by the type of health variable they affect">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-800">{filteredCount}</span>
            <span className="text-gray-500">of {totalCount} insights</span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-2 px-2.5 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-lg hover:bg-primary-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Variable Type Cards */}
        <div className="grid grid-cols-3 gap-3">
          {(['outcome', 'load', 'marker'] as InsightVariableType[]).map((type) => {
            const meta = INSIGHT_VARIABLE_TYPE_META[type]
            const isSelected = variableTypes.length === 0 || variableTypes.includes(type)
            const count = variableTypeCounts[type] || 0

            return (
              <button
                key={type}
                onClick={() => toggleVariableType(type)}
                className={cn(
                  'relative flex items-center gap-3 p-3 text-left transition-all border rounded-xl',
                  isSelected
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-slate-50 border-slate-100 opacity-50 hover:opacity-75'
                )}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: isSelected ? meta.color : '#F3F4F6',
                  }}
                >
                  <span className={isSelected ? 'text-white' : 'text-gray-400'}>
                    {variableTypeIcons[type]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('font-medium text-sm', isSelected ? 'text-slate-800' : 'text-gray-500')}>
                      {meta.label}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        isSelected ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{meta.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Longevity Insights Card removed — was showing hardcoded fake data
         from a fictional persona. All insights now come from the BCEL pipeline. */}

      {/* Secondary Filters Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card padding="none" className="rounded-xl">
          <div className="p-4 flex items-center justify-between flex-wrap gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mr-1">Domain:</span>
              {insightCategories.map((cat) => {
                const config = categoryConfig[cat.category] || { label: cat.category, emoji: '📊' }
                const isSelected = categories.includes(cat.category)
                const count = categoryCounts[cat.category] || 0

                return (
                  <button
                    key={cat.category}
                    onClick={() => toggleCategory(cat.category)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all border rounded-full',
                      isSelected
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary-200 hover:bg-primary-50/50'
                    )}
                  >
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 text-xs rounded-full',
                      isSelected ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'
                    )}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* More Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all border rounded-lg',
                  showMoreFilters
                    ? 'bg-primary-50 text-primary-600 border-primary-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                More Filters
                <ChevronDown className={cn('w-4 h-4 transition-transform', showMoreFilters && 'rotate-180')} />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showMoreFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-200"
            >
              <div className="grid grid-cols-2">
                {/* Certainty Slider */}
                <div className="p-4 border-r border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Min Certainty</label>
                    <span className="text-sm font-semibold text-slate-800">{Math.round(minCertainty * 100)}%</span>
                  </div>
                  <CertaintySlider
                    value={Math.round(minCertainty * 100)}
                    onChange={(val) => setMinCertainty(val / 100)}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {minCertainty >= 0.7
                      ? 'High-confidence only'
                      : minCertainty >= 0.4
                      ? 'Moderate certainty'
                      : 'Including exploratory'}
                  </p>
                </div>

                {/* Actionable Toggle */}
                <div className="p-4 flex items-start gap-3">
                  <Toggle
                    label="Actionable only"
                    description="Show only insights with recommended actions"
                    checked={actionableOnly}
                    onToggle={setActionableOnly}
                    size="sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Insights Grid - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        {insights.length > 0 ? (
          viewMode === 'grid' ? (
            <InsightGrid
              insights={insights}
              onInsightAction={handleInsightAction}
              variant="detailed"
            />
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  variant="compact"
                  onAction={(action) => handleInsightAction(insight.id, action)}
                />
              ))}
            </div>
          )
        ) : (
          <Card padding="none" className="text-center rounded-xl">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 rounded-t-xl">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">No Results</span>
            </div>
            <div className="p-12">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-slate-500 mb-4">
                No insights match your current filters.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </Card>
        )}
      </motion.div>
    </PageLayout>
  )
}

export default InsightsView
