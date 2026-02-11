import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/classNames'
import { Play, Plus, X, Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Card, Button, Slider } from '@/components/common'
import { useSimulator, type SimulatorResultDisplay } from '@/hooks'

export interface WhatIfSimulatorProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

const interventionOptions = [
  { id: 'caffeine_cutoff', label: 'Caffeine Cutoff', unit: 'hour', min: 10, max: 20, default: 14 },
  { id: 'exercise_time', label: 'Exercise Time', unit: 'hour', min: 6, max: 22, default: 17 },
  { id: 'screen_cutoff', label: 'Screen Cutoff', unit: 'hour', min: 19, max: 24, default: 22 },
  { id: 'alcohol_drinks', label: 'Alcohol (drinks)', unit: 'drinks', min: 0, max: 5, default: 0 },
  { id: 'bedtime_variance', label: 'Bedtime Variance', unit: 'min', min: 0, max: 120, default: 30 },
]

const formatTime = (hour: number) => {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m > 0 ? `${displayH}:${m.toString().padStart(2, '0')} ${period}` : `${displayH} ${period}`
}

export const WhatIfSimulator = forwardRef<HTMLDivElement, WhatIfSimulatorProps>(
  ({ className, onClose, ...props }, ref) => {
    const {
      inputs,
      results,
      isSimulating,
      hasRun,
      combinedImpact,
      setInput,
      addInput,
      removeInput,
      runSimulation,
      resetSimulation,
      loadPreset,
      availablePresets,
    } = useSimulator()

    const [showAddMenu, setShowAddMenu] = useState(false)

    // Get available interventions (not already added)
    const availableInterventions = interventionOptions.filter(
      opt => !inputs.some(input => input.intervention === opt.id)
    )

    const handleAddIntervention = (optionId: string) => {
      const option = interventionOptions.find(o => o.id === optionId)
      if (option) {
        addInput({
          intervention: option.id,
          currentValue: option.default,
          proposedValue: option.default,
          unit: option.unit,
        })
      }
      setShowAddMenu(false)
    }

    const getInterventionConfig = (id: string) => {
      return interventionOptions.find(o => o.id === id)
    }

    return (
      <Card
        ref={ref}
        className={cn('p-6', className)}
        data-tour="simulator"
        {...props}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">What-If Simulator</h2>
            <p className="text-sm text-gray-500">Test how changes might affect your outcomes</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs text-gray-500 self-center mr-1">Presets:</span>
          {availablePresets.map((preset) => (
            <button
              key={preset}
              onClick={() => loadPreset(preset)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
            >
              {preset.replace(/-/g, ' ')}
            </button>
          ))}
        </div>

        {/* Interventions */}
        <div className="space-y-4 mb-6">
          {inputs.map((input, index) => {
            const config = getInterventionConfig(input.intervention)
            if (!config) return null

            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">{config.label}</span>
                  <button
                    onClick={() => removeInput(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Current</label>
                    <div className="text-sm font-medium text-gray-600">
                      {config.unit === 'hour' ? formatTime(input.currentValue) : `${input.currentValue} ${config.unit}`}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Proposed</label>
                    <Slider
                      value={input.proposedValue}
                      min={config.min}
                      max={config.max}
                      step={config.unit === 'hour' ? 0.5 : 1}
                      onChange={(value) => setInput(index, { proposedValue: value })}
                      size="sm"
                    />
                    <div className="text-sm font-medium text-primary-600 mt-1">
                      {config.unit === 'hour' ? formatTime(input.proposedValue) : `${input.proposedValue} ${config.unit}`}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add intervention */}
        {availableInterventions.length > 0 && (
          <div className="relative mb-6">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Intervention
            </button>
            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                >
                  {availableInterventions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAddIntervention(option.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Run button */}
        <Button
          onClick={runSimulation}
          loading={isSimulating}
          disabled={inputs.length === 0}
          fullWidth
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Run Simulation
        </Button>

        {/* Results */}
        <AnimatePresence>
          {hasRun && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <h3 className="font-medium text-gray-900 mb-4">Projected Impact</h3>

              <div className="space-y-3">
                {results.map((result, index) => (
                  <SimulatorResultCard key={index} result={result} />
                ))}
              </div>

              {/* Combined impact */}
              {combinedImpact && combinedImpact.interactions.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Interactions Detected</p>
                      <ul className="text-xs text-amber-700 mt-1">
                        {combinedImpact.interactions.map((interaction, i) => (
                          <li key={i}>• {interaction}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={resetSimulation}
                className="mt-4"
              >
                Reset Results
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    )
  }
)

WhatIfSimulator.displayName = 'WhatIfSimulator'

// Result card component
interface SimulatorResultCardProps {
  result: SimulatorResultDisplay
}

const SimulatorResultCard = ({ result }: SimulatorResultCardProps) => {
  const isPositive = result.change >= 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{result.metric}</span>
        <span className={cn('text-sm font-semibold flex items-center gap-1', changeColor)}>
          <TrendIcon className="w-3 h-3" />
          {isPositive ? '+' : ''}{result.change.toFixed(1)}
          <span className="text-gray-400 text-xs">({result.changePercent.toFixed(1)}%)</span>
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>From: {result.baseline.toFixed(1)}</span>
        <span>→</span>
        <span className="font-medium text-gray-700">To: {result.projected.toFixed(1)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Confidence: {Math.round(result.certainty * 100)}%
        </span>
        <span className="text-gray-500">
          Time to effect: {result.timeToEffect}
        </span>
      </div>

      {/* Confidence interval */}
      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
        <div
          className="absolute h-full bg-primary-200"
          style={{
            left: `${((result.confidenceInterval.low - result.baseline) / (result.confidenceInterval.high - result.confidenceInterval.low + result.baseline)) * 100}%`,
            width: `${((result.confidenceInterval.high - result.confidenceInterval.low) / result.baseline) * 100}%`,
          }}
        />
        <div
          className="absolute h-full w-1 bg-primary-600"
          style={{
            left: `${((result.projected - result.confidenceInterval.low) / (result.confidenceInterval.high - result.confidenceInterval.low)) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}

export default WhatIfSimulator
