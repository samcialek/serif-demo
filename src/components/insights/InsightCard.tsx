import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, transitions } from '@/utils/classNames'
import { ChevronDown, ChevronUp, Target, Sparkles, Code, X, Copy, Check } from 'lucide-react'
import { Card, CategoryBadge, CertaintyBadge, Button } from '@/components/common'
import { DoseResponseCurve, EffectSizeDisplay } from '@/components/charts'
import type { Insight, CurveType } from '@/types'
import { oronPersona } from '@/data/personas/oron'
import { LoadLeverPanel } from '@/components/protocols/LoadLeverPanel'

export interface InsightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  insight: Insight
  onAction?: (action: string) => void
  expanded?: boolean
  showEvidence?: boolean
  interactive?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

const categoryIcons = {
  sleep: '🌙',
  metabolic: '⚡',
  recovery: '💚',
  cognitive: '🧠',
  activity: '🏃',
  stress: '🧘',
  nutrition: '🥗',
  cardio: '❤️',
  mood: '😊',
}

// Faint category-based background tints for insight cards
const categoryBackgrounds: Record<string, string> = {
  sleep: 'bg-secondary-50/40 border-secondary-100',
  metabolic: 'bg-accent-50/40 border-accent-100',
  recovery: 'bg-primary-50/40 border-primary-100',
  cognitive: 'bg-secondary-50/30 border-secondary-100',
  activity: 'bg-primary-50/30 border-primary-100',
  stress: 'bg-accent-50/30 border-accent-100',
  nutrition: 'bg-emerald-50/40 border-emerald-100',
  cardio: 'bg-rose-50/40 border-rose-100',
  mood: 'bg-amber-50/40 border-amber-100',
}

const curveTypeLabels: Record<CurveType, string> = {
  plateau_up: '↗',
  plateau_down: '↘',
  v_min: '∪',
  v_max: '∩',
  linear: '→',
}

// Code Modal Component
interface CodeModalProps {
  insight: Insight
  onClose: () => void
}

const CodeModal = ({ insight, onClose }: CodeModalProps) => {
  const [copied, setCopied] = useState(false)
  const jsonCode = JSON.stringify(insight, null, 2)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Code className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Insight Data</h3>
              <p className="text-xs text-slate-500">JSON representation of this insight</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                copied
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="overflow-auto max-h-[calc(80vh-80px)]">
          <pre className="p-5 text-xs font-mono leading-relaxed text-slate-700 bg-slate-900 overflow-x-auto">
            <code className="language-json">
              {jsonCode.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="select-none text-slate-600 w-10 text-right pr-4 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-slate-200">
                    {/* Simple syntax highlighting */}
                    {line.replace(
                      /(".*?")(:\s*)?(".*?"|[\d.]+|true|false|null)?/g,
                      (match, key, colon, value) => {
                        if (colon && value) {
                          // Key: value pair
                          const keyColor = 'text-primary-400'
                          const valueColor = value.startsWith('"')
                            ? 'text-emerald-400'
                            : value === 'true' || value === 'false'
                              ? 'text-amber-400'
                              : value === 'null'
                                ? 'text-slate-500'
                                : 'text-violet-400'
                          return `<span class="${keyColor}">${key}</span>${colon}<span class="${valueColor}">${value}</span>`
                        } else if (colon) {
                          // Key only
                          return `<span class="text-primary-400">${key}</span>${colon}`
                        } else {
                          // Value in array
                          const valueColor = key.startsWith('"')
                            ? 'text-emerald-400'
                            : 'text-violet-400'
                          return `<span class="${valueColor}">${key}</span>`
                        }
                      }
                    ).split(/<span|<\/span>/).map((part, j) => {
                      if (part.startsWith(' class="')) {
                        const classMatch = part.match(/class="([^"]+)">(.*)/s)
                        if (classMatch) {
                          return <span key={j} className={classMatch[1]}>{classMatch[2]}</span>
                        }
                      }
                      return part
                    })}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Format: JSON (JavaScript Object Notation)</span>
            <span>{jsonCode.split('\n').length} lines</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export const InsightCard = forwardRef<HTMLDivElement, InsightCardProps>(
  (
    {
      className,
      insight,
      onAction,
      expanded: controlledExpanded,
      showEvidence = true,
      interactive = true,
      variant = 'default',
      ...props
    },
    ref
  ) => {
    const [internalExpanded, setInternalExpanded] = useState(false)
    const [showCode, setShowCode] = useState(false)
    const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

    const toggleExpand = () => {
      if (controlledExpanded === undefined) {
        setInternalExpanded(!internalExpanded)
      }
    }

    const icon = categoryIcons[insight.category as keyof typeof categoryIcons] || '💡'
    const hasCausalParams = !!insight.causalParams

    // Only show current position for Loads and Markers (slow-changing variables)
    // Outcomes are daily metrics that fluctuate - current position is less meaningful
    const showCurrentPosition = insight.variableType === 'load' || insight.variableType === 'marker'

    // Get category background class
    const categoryBg = categoryBackgrounds[insight.category as keyof typeof categoryBackgrounds] || ''

    // Compact variant - Clinical Precision
    if (variant === 'compact') {
      return (
        <>
          <Card
            ref={ref}
            className={cn('p-4', categoryBg, interactive && 'cursor-pointer', className)}
            onClick={interactive ? () => onAction?.('view') : undefined}
            {...props}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <CategoryBadge category={insight.category as any} size="sm" />
                  <span className="text-xs font-medium text-primary-600">{Math.round(insight.certainty * 100)}%</span>
                  {hasCausalParams && (
                    <span className="text-[10px] text-slate-400" title={insight.causalParams!.curveType}>
                      {curveTypeLabels[insight.causalParams!.curveType]}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCode(true)
                    }}
                    className="ml-auto p-1 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    title="View JSON"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-800 line-clamp-2">{insight.title}</p>
                {hasCausalParams && (
                  <p className="text-xs text-slate-500 mt-1.5 font-mono">
                    θ = {insight.causalParams!.theta.displayValue}
                  </p>
                )}
              </div>
            </div>
          </Card>
          <AnimatePresence>
            {showCode && <CodeModal insight={insight} onClose={() => setShowCode(false)} />}
          </AnimatePresence>
        </>
      )
    }

    return (
      <>
        <Card
          ref={ref}
          className={cn(
            'overflow-hidden',
            categoryBg,
            className
          )}
          padding="none"
          data-tour="insight-cards"
          {...props}
        >
          {/* Header - Clinical Precision */}
          <div className="p-5 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <CategoryBadge category={insight.category as any} />
                {hasCausalParams && (
                  <span
                    className="px-2 py-0.5 text-[10px] text-slate-500 bg-slate-50 rounded-full"
                    title={`Curve type: ${insight.causalParams!.curveType}`}
                  >
                    {curveTypeLabels[insight.causalParams!.curveType]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCode(true)}
                  className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="View JSON"
                >
                  <Code className="w-4 h-4" />
                </button>
                <CertaintyBadge certainty={insight.certainty} />
              </div>
            </div>

            {/* Title - Clinical Precision */}
            <h3 className="text-base font-semibold text-slate-800 tracking-tight mb-1">{insight.title}</h3>
            <p className="text-sm text-slate-500">{insight.headline}</p>

            {/* Data Source Indicators - Color-coded badges showing multi-source integration */}
            {insight.dataSources && insight.dataSources.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Data:</span>
                {insight.dataSources.map((source, i) => {
                  // Color-code by data type
                  const sourceColors: Record<string, string> = {
                    'oura': 'bg-violet-100 text-violet-700 border-violet-200',
                    'dexcom': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    'apple-watch': 'bg-slate-100 text-slate-700 border-slate-200',
                    'fitbit': 'bg-teal-100 text-teal-700 border-teal-200',
                    'bloodwork': 'bg-rose-100 text-rose-700 border-rose-200',
                    'mito-app': 'bg-amber-100 text-amber-700 border-amber-200',
                    'weather': 'bg-sky-100 text-sky-700 border-sky-200',
                    'whoop': 'bg-orange-100 text-orange-700 border-orange-200',
                    'levels': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                  }
                  const colorClass = sourceColors[source.toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200'
                  const displayName = source.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${colorClass}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                      {displayName}
                    </span>
                  )
                })}
                {insight.dataSources.length > 1 && (
                  <span className="text-[9px] text-primary-600 font-medium ml-1">
                    Multi-source insight
                  </span>
                )}
              </div>
            )}

            {/* Recommendation - Clinical Precision with cyan accent */}
            <div className="mt-4 p-4 bg-primary-50/50 rounded-lg border-l-[3px] border-l-serif-cyan">
              <div className="flex items-start gap-3">
                <Target className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{insight.recommendation}</p>
                  <p className="text-xs text-slate-500 mt-1">{insight.explanation}</p>
                </div>
              </div>
              {/* Lever panel for load-related insights */}
              {(() => {
                const matchingLoad = oronPersona.loads?.find(
                  (load) => load.affectedInsightIds?.includes(insight.id) && load.levers
                )
                if (!matchingLoad?.levers) return null
                return (
                  <div className="mt-3 pt-3 border-t border-primary-100/50">
                    <LoadLeverPanel
                      levers={matchingLoad.levers}
                      loadLabel={matchingLoad.label}
                      decreaseIsGood={matchingLoad.strategy === 'recover'}
                    />
                  </div>
                )
              })()}
            </div>

            {/* Show Work - Always Visible Preview */}
            {insight.showWork && (
              <div className="mt-4 p-4 bg-amber-50/70 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-amber-100 rounded">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Causal Analysis</h4>
                      <span className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                        n={insight.evidence.personalDays} days · {Math.round(insight.certainty * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{insight.showWork}</p>
                    <p className="text-[10px] text-amber-600 mt-2 italic">
                      This insight uses causal inference (not just correlation) to control for confounding variables.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dose-Response Curve (when causalParams available) */}
            {hasCausalParams && variant === 'detailed' && (
              <div className="mt-5">
                <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Dose-Response Curve</h4>
                <div className="bg-slate-50/50 rounded-lg p-2">
                  <DoseResponseCurve
                    params={insight.causalParams!}
                    width="100%"
                    height={120}
                    showCurrentValue={showCurrentPosition}
                  />
                </div>
              </div>
            )}

            {/* Effect Sizes - Clinical Precision */}
            {hasCausalParams && (
              <div className="mt-5">
                <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Effect Sizes (β)</h4>
                <EffectSizeDisplay params={insight.causalParams!} />
              </div>
            )}

            {/* Current Status - Only show for Loads and Markers (not Outcomes) */}
            {hasCausalParams && insight.causalParams!.currentStatus && showCurrentPosition && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Status:</span>
                <span className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full',
                  insight.causalParams!.currentStatus === 'at_optimal' && 'bg-emerald-50 text-emerald-600',
                  (insight.causalParams!.currentStatus === 'above_optimal' || insight.causalParams!.currentStatus === 'above_threshold') && 'bg-amber-50 text-amber-600',
                  (insight.causalParams!.currentStatus === 'below_optimal' || insight.causalParams!.currentStatus === 'below_threshold') && 'bg-primary-50 text-primary-600',
                )}>
                  {insight.causalParams!.currentStatus === 'at_optimal' && 'At optimal'}
                  {(insight.causalParams!.currentStatus === 'above_optimal' || insight.causalParams!.currentStatus === 'above_threshold') && 'Above θ'}
                  {(insight.causalParams!.currentStatus === 'below_optimal' || insight.causalParams!.currentStatus === 'below_threshold') && 'Below θ'}
                </span>
                {insight.causalParams!.currentValue !== undefined && (
                  <span className="text-xs font-mono text-slate-400">
                    ({insight.causalParams!.currentValue})
                  </span>
                )}
              </div>
            )}

            {/* Population vs Individual Threshold Comparison */}
            {insight.populationThreshold && (
              <div className="mt-5 p-4 bg-gradient-to-r from-slate-50 to-primary-50/30 rounded-lg border border-primary-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Your Threshold vs Population</span>
                </div>
                <div className="flex items-center gap-4">
                  {/* Population */}
                  <div className="flex-1 text-center p-3 bg-white rounded-lg border border-slate-200">
                    <div className="text-lg font-semibold text-slate-500">{insight.populationThreshold.value}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{insight.populationThreshold.label}</div>
                  </div>
                  {/* Arrow */}
                  <div className="flex flex-col items-center">
                    <span className="text-primary-500 text-lg">→</span>
                  </div>
                  {/* Personal */}
                  <div className="flex-1 text-center p-3 bg-primary-50 rounded-lg border-2 border-primary-300">
                    <div className="text-lg font-bold text-primary-700">{insight.cause.threshold}</div>
                    <div className="text-[10px] text-primary-600 uppercase tracking-wider font-medium">Your Threshold</div>
                  </div>
                </div>
                {insight.populationThreshold.variance && (
                  <div className="mt-3 text-center">
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                      ✓ {insight.populationThreshold.variance}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Comparison (before/after) - Clinical Precision */}
            {insight.comparison && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className={cn(
                  'p-4 text-center rounded-lg',
                  insight.outcome.direction === 'negative' ? 'bg-rose-50' : 'bg-slate-50'
                )}>
                  <div className="text-2xl font-semibold text-slate-800">{insight.comparison.before.value}</div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{insight.comparison.before.label}</div>
                </div>
                <div className={cn(
                  'p-4 text-center rounded-lg',
                  insight.outcome.direction === 'positive' || insight.outcome.direction === 'negative' ? 'bg-emerald-50' : 'bg-slate-50'
                )}>
                  <div className="text-2xl font-semibold text-slate-800">{insight.comparison.after.value}</div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{insight.comparison.after.label}</div>
                </div>
              </div>
            )}
          </div>

          {/* Evidence bar - Clinical Precision */}
          <div className="px-5 pb-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Personal</span>
                  <span className="font-medium text-primary-600">{Math.round(insight.evidence.personalWeight * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-serif-cyan rounded-full"
                    style={{ width: `${insight.evidence.personalWeight * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Population</span>
                  <span className="font-medium text-slate-500">{Math.round(insight.evidence.populationWeight * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-300 rounded-full"
                    style={{ width: `${insight.evidence.populationWeight * 100}%` }}
                  />
                </div>
              </div>
              {hasCausalParams && (
                <div className="font-mono text-slate-400 text-[10px]">
                  n={insight.causalParams!.observations}
                </div>
              )}
            </div>
          </div>

          {/* Expandable evidence section - Clinical Precision */}
          {showEvidence && variant === 'detailed' && (
            <>
              <button
                onClick={toggleExpand}
                className={cn(
                  'w-full px-5 py-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider',
                  'hover:bg-slate-50 border-t border-slate-100 text-slate-500',
                  transitions.colors
                )}
              >
                <span>Show Work & Details</span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                    data-tour="insight-evidence"
                  >
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4 bg-slate-50/50">
                      {/* Why Now */}
                      {insight.whyNow && (
                        <div>
                          <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Why Now?</h4>
                          <p className="text-sm text-slate-600">{insight.whyNow}</p>
                        </div>
                      )}

                      {/* Holdout Preview */}
                      {insight.holdoutPreview && (
                        <div className="p-4 bg-secondary-50 rounded-lg border-l-[3px] border-l-serif-lavender">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-secondary-500" />
                            <h4 className="text-[10px] font-medium text-secondary-600 uppercase tracking-wider">Predicted Impact</h4>
                          </div>
                          <p className="text-sm font-medium text-secondary-700">
                            {insight.holdoutPreview.expectedChange > 0 ? '+' : ''}
                            {insight.holdoutPreview.expectedChange} {insight.holdoutPreview.unit} in {insight.holdoutPreview.horizon}
                          </p>
                        </div>
                      )}

                      {/* Data Sources */}
                      {insight.dataSources && insight.dataSources.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Data Sources</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {insight.dataSources.map((source, i) => (
                              <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-xs text-slate-600 rounded-full">
                                {source.replace(/-/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Causal Chain */}
                      {insight.causalChain && (
                        <div>
                          <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Causal Path</h4>
                          <div className="flex items-center gap-1.5 text-sm flex-wrap">
                            {insight.causalChain.map((step, i) => (
                              <span key={i} className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs">{step}</span>
                                {i < insight.causalChain!.length - 1 && (
                                  <span className="text-slate-300">→</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Actions - Clinical Precision */}
          {insight.actionable && (
            <div className="px-5 pb-5 flex items-center gap-2">
              {insight.suggestedAction && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onAction?.(insight.suggestedAction!)}
                >
                  {insight.suggestedAction}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAction?.('simulate')}
              >
                Simulate
              </Button>
            </div>
          )}
        </Card>

        {/* Code Modal */}
        <AnimatePresence>
          {showCode && <CodeModal insight={insight} onClose={() => setShowCode(false)} />}
        </AnimatePresence>
      </>
    )
  }
)

InsightCard.displayName = 'InsightCard'

// Insight Grid
export interface InsightGridProps extends React.HTMLAttributes<HTMLDivElement> {
  insights: Insight[]
  onInsightAction?: (insightId: string, action: string) => void
  emptyState?: React.ReactNode
  variant?: 'default' | 'compact' | 'detailed'
}

export const InsightGrid = forwardRef<HTMLDivElement, InsightGridProps>(
  ({ className, insights, onInsightAction, emptyState, variant = 'default', ...props }, ref) => {
    if (insights.length === 0 && emptyState) {
      return <div ref={ref} className={className} {...props}>{emptyState}</div>
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid gap-5',
          variant === 'compact' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2',
          className
        )}
        {...props}
      >
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            variant={variant}
            onAction={(action) => onInsightAction?.(insight.id, action)}
          />
        ))}
      </div>
    )
  }
)

InsightGrid.displayName = 'InsightGrid'

export default InsightCard
