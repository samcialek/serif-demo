import { forwardRef, useCallback } from 'react'
import { Target, TrendingUp, Activity } from 'lucide-react'
import { cn } from '@/utils/classNames'
import { CertaintySlider } from '@/components/common'
import { useDemoStore } from '@/stores/demoStore'
import type { InsightVariableType } from '@/types'
import { INSIGHT_VARIABLE_TYPE_META } from '@/data/insights/types'

export interface CertaintyFilterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: number
  onChange?: (value: number) => void
  showDescription?: boolean
  showPresets?: boolean
  label?: string
}

const presets = [
  { value: 30, label: 'Exploratory', description: 'Show all insights including low certainty' },
  { value: 50, label: 'Moderate', description: 'Balanced between coverage and confidence' },
  { value: 70, label: 'High', description: 'Only show confident insights' },
  { value: 85, label: 'Very High', description: 'Only the most certain insights' },
]

export const CertaintyFilter = forwardRef<HTMLDivElement, CertaintyFilterProps>(
  (
    {
      className,
      value: controlledValue,
      onChange: controlledOnChange,
      showDescription = true,
      showPresets = false,
      label = 'Certainty Threshold',
      ...props
    },
    ref
  ) => {
    const { certaintyThreshold, setCertaintyThreshold } = useDemoStore()

    const value = controlledValue !== undefined ? controlledValue : certaintyThreshold
    const onChange = controlledOnChange || setCertaintyThreshold

    const getDescription = useCallback((val: number) => {
      if (val >= 85) return 'Showing only insights with very high confidence. You may miss some useful patterns.'
      if (val >= 70) return 'Showing insights where we have strong evidence from your personal data.'
      if (val >= 50) return 'Balanced view showing insights with moderate to high certainty.'
      if (val >= 30) return 'Showing more insights, including those based partly on population data.'
      return 'Showing all insights including exploratory patterns. Use with caution.'
    }, [])

    return (
      <div ref={ref} className={cn('', className)} data-tour="certainty-slider" {...props}>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm font-semibold text-primary-600">{value}%</span>
        </div>

        <CertaintySlider
          value={value}
          onChange={onChange}
          showCertaintyLabel={false}
        />

        {showDescription && (
          <p className="mt-3 text-xs text-gray-500">{getDescription(value)}</p>
        )}

        {showPresets && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onChange(preset.value)}
                className={cn(
                  'px-3 py-2 rounded-lg text-left text-sm transition-colors',
                  value === preset.value
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                )}
              >
                <span className="font-medium">{preset.label}</span>
                <span className="text-xs text-gray-400 ml-1">{preset.value}%</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

CertaintyFilter.displayName = 'CertaintyFilter'

// Variable Type Filter (COMPLE Framework: Outcomes, Loads, Markers)
export interface VariableTypeFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedTypes: InsightVariableType[]
  onToggle: (type: InsightVariableType) => void
  showCounts?: Record<InsightVariableType, number>
}

const variableTypeIcons: Record<InsightVariableType, React.ReactNode> = {
  outcome: <Target className="w-4 h-4" />,
  load: <TrendingUp className="w-4 h-4" />,
  marker: <Activity className="w-4 h-4" />,
}

export const VariableTypeFilter = forwardRef<HTMLDivElement, VariableTypeFilterProps>(
  ({ className, selectedTypes, onToggle, showCounts, ...props }, ref) => {
    const types: InsightVariableType[] = ['outcome', 'load', 'marker']

    return (
      <div ref={ref} className={cn('', className)} {...props}>
        <label className="text-sm font-medium text-gray-700 mb-3 block">Variable Type</label>
        <p className="text-xs text-gray-500 mb-3">Filter by what the insight affects</p>
        <div className="space-y-2">
          {types.map((type) => {
            const meta = INSIGHT_VARIABLE_TYPE_META[type]
            const isSelected = selectedTypes.includes(type)
            const count = showCounts?.[type]

            return (
              <button
                key={type}
                onClick={() => onToggle(type)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all border',
                  isSelected
                    ? cn(meta.bgColor, meta.borderColor, 'ring-1 ring-offset-1')
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                )}
                style={isSelected ? { '--tw-ring-color': meta.color } as React.CSSProperties : undefined}
              >
                <span className={cn(
                  'p-1.5 rounded-md',
                  isSelected ? 'bg-white/60' : 'bg-gray-100'
                )} style={isSelected ? { color: meta.color } : { color: '#6B7280' }}>
                  {variableTypeIcons[type]}
                </span>
                <div className="flex-1">
                  <span className={cn('font-medium', isSelected ? 'text-gray-900' : 'text-gray-600')}>
                    {meta.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                </div>
                {count !== undefined && (
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded-full font-medium',
                    isSelected ? 'bg-white/60 text-gray-700' : 'bg-gray-200 text-gray-500'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
)

VariableTypeFilter.displayName = 'VariableTypeFilter'

// Category Filter
export interface CategoryFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  categories: string[]
  selectedCategories: string[]
  onToggle: (category: string) => void
  showCounts?: Record<string, number>
}

const categoryConfig: Record<string, { label: string; color: string; emoji: string }> = {
  sleep: { label: 'Sleep', color: 'bg-insight-sleep/10 text-insight-sleep', emoji: '😴' },
  metabolic: { label: 'Metabolic', color: 'bg-insight-metabolic/10 text-insight-metabolic', emoji: '🔥' },
  recovery: { label: 'Recovery', color: 'bg-insight-recovery/10 text-insight-recovery', emoji: '💪' },
  cognitive: { label: 'Cognitive', color: 'bg-insight-cognitive/10 text-insight-cognitive', emoji: '🧠' },
  activity: { label: 'Activity', color: 'bg-insight-activity/10 text-insight-activity', emoji: '🏃' },
  stress: { label: 'Stress', color: 'bg-insight-stress/10 text-insight-stress', emoji: '🧘' },
  nutrition: { label: 'Nutrition', color: 'bg-insight-nutrition/10 text-insight-nutrition', emoji: '🥗' },
}

export const CategoryFilter = forwardRef<HTMLDivElement, CategoryFilterProps>(
  ({ className, categories, selectedCategories, onToggle, showCounts, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        <label className="text-sm font-medium text-gray-700 mb-3 block">Categories</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const config = categoryConfig[category] || { label: category, color: 'bg-gray-100 text-gray-600', emoji: '📊' }
            const isSelected = selectedCategories.includes(category)
            const count = showCounts?.[category]

            return (
              <button
                key={category}
                onClick={() => onToggle(category)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  isSelected
                    ? cn(config.color, 'ring-2 ring-offset-1')
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
                {count !== undefined && (
                  <span className={cn(
                    'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                    isSelected ? 'bg-white/50' : 'bg-gray-200'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
)

CategoryFilter.displayName = 'CategoryFilter'

// Combined Insight Filters Panel
export interface InsightFiltersPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  certaintyValue: number
  onCertaintyChange: (value: number) => void
  // Variable type filter (first level)
  variableTypes?: InsightVariableType[]
  selectedVariableTypes?: InsightVariableType[]
  onVariableTypeToggle?: (type: InsightVariableType) => void
  variableTypeCounts?: Record<InsightVariableType, number>
  // Category filter (second level)
  categories: string[]
  selectedCategories: string[]
  onCategoryToggle: (category: string) => void
  categoryCounts?: Record<string, number>
  totalCount: number
  filteredCount: number
  onReset: () => void
}

export const InsightFiltersPanel = forwardRef<HTMLDivElement, InsightFiltersPanelProps>(
  (
    {
      className,
      certaintyValue,
      onCertaintyChange,
      selectedVariableTypes = [],
      onVariableTypeToggle,
      variableTypeCounts,
      categories,
      selectedCategories,
      onCategoryToggle,
      categoryCounts,
      totalCount,
      filteredCount,
      onReset,
      ...props
    },
    ref
  ) => {
    const hasFilters = certaintyValue !== 50 || selectedCategories.length > 0 || selectedVariableTypes.length > 0

    return (
      <div ref={ref} className={cn('space-y-6', className)} {...props}>
        {/* Variable Type Filter - First Level (COMPLE Framework) */}
        {onVariableTypeToggle && (
          <VariableTypeFilter
            selectedTypes={selectedVariableTypes}
            onToggle={onVariableTypeToggle}
            showCounts={variableTypeCounts}
          />
        )}

        {/* Category Filter - Second Level (Domain) */}
        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onToggle={onCategoryToggle}
          showCounts={categoryCounts}
        />

        {/* Certainty Filter */}
        <CertaintyFilter
          value={certaintyValue}
          onChange={onCertaintyChange}
          showDescription
        />

        {/* Results count */}
        <div className="text-sm">
          <span className="text-gray-500">
            Showing <span className="font-medium text-gray-900">{filteredCount}</span> of {totalCount} insights
          </span>
          {hasFilters && (
            <button
              onClick={onReset}
              className="block mt-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>
    )
  }
)

InsightFiltersPanel.displayName = 'InsightFiltersPanel'

export default CertaintyFilter
