/**
 * Hook for What-If simulator functionality
 */

import { useState, useMemo, useCallback } from 'react'
import { useDemoStore } from '@/stores/demoStore'
import { usePersonaStore } from '@/stores/personaStore'
import { getPersonaById, getMetricsForPersona } from '@/data/personas'
import { delay } from '@/utils/simulateDelay'

export interface SimulatorInput {
  intervention: string
  currentValue: number
  proposedValue: number
  unit: string
}

export interface SimulatorResultDisplay {
  metric: string
  baseline: number
  projected: number
  change: number
  changePercent: number
  certainty: number
  timeToEffect: string
  confidenceInterval: {
    low: number
    high: number
  }
}

export interface UseSimulatorReturn {
  // State
  inputs: SimulatorInput[]
  results: SimulatorResultDisplay[]
  isSimulating: boolean
  hasRun: boolean
  combinedImpact: {
    totalChange: number
    interactions: string[]
    netCertainty: number
  } | null

  // Actions
  setInput: (index: number, input: Partial<SimulatorInput>) => void
  addInput: (input: SimulatorInput) => void
  removeInput: (index: number) => void
  clearInputs: () => void
  runSimulation: () => Promise<void>
  resetSimulation: () => void

  // Presets
  loadPreset: (presetName: string) => void
  availablePresets: string[]
}

// Preset scenarios for quick testing
const SIMULATOR_PRESETS: Record<string, SimulatorInput[]> = {
  'caffeine-cutoff': [
    { intervention: 'caffeine_cutoff', currentValue: 16, proposedValue: 14, unit: 'hour' },
  ],
  'exercise-timing': [
    { intervention: 'exercise_time', currentValue: 19, proposedValue: 17, unit: 'hour' },
  ],
  'sleep-consistency': [
    { intervention: 'bedtime_variance', currentValue: 60, proposedValue: 30, unit: 'min' },
  ],
  'alcohol-reduction': [
    { intervention: 'alcohol_drinks', currentValue: 2, proposedValue: 0, unit: 'drinks' },
  ],
  'combined-sleep': [
    { intervention: 'caffeine_cutoff', currentValue: 16, proposedValue: 14, unit: 'hour' },
    { intervention: 'screen_cutoff', currentValue: 23, proposedValue: 21.5, unit: 'hour' },
    { intervention: 'alcohol_drinks', currentValue: 2, proposedValue: 1, unit: 'drinks' },
  ],
}

export function useSimulator(): UseSimulatorReturn {
  const { activePersonaId } = usePersonaStore()
  const { addToast } = useDemoStore()

  const [inputs, setInputs] = useState<SimulatorInput[]>([
    { intervention: 'caffeine_cutoff', currentValue: 16, proposedValue: 14, unit: 'hour' },
  ])
  const [results, setResults] = useState<SimulatorResultDisplay[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  // Get persona for sensitivity modifiers
  const persona = useMemo(() => getPersonaById(activePersonaId), [activePersonaId])
  const metrics = useMemo(() => getMetricsForPersona(activePersonaId), [activePersonaId])

  // Calculate combined impact from results
  const combinedImpact = useMemo(() => {
    if (results.length === 0) return null
    const totalChange = results.reduce((sum, r) => sum + r.change, 0)
    const netCertainty = results.reduce((sum, r) => sum + r.certainty, 0) / results.length
    return {
      totalChange,
      interactions: results.length > 1 ? ['Stacking effects may compound'] : [],
      netCertainty,
    }
  }, [results])

  // Set a specific input
  const setInput = useCallback((index: number, updates: Partial<SimulatorInput>) => {
    setInputs(prev => {
      const newInputs = [...prev]
      newInputs[index] = { ...newInputs[index], ...updates }
      return newInputs
    })
    setHasRun(false)
  }, [])

  // Add a new input
  const addInput = useCallback((input: SimulatorInput) => {
    setInputs(prev => [...prev, input])
    setHasRun(false)
  }, [])

  // Remove an input
  const removeInput = useCallback((index: number) => {
    setInputs(prev => prev.filter((_, i) => i !== index))
    setHasRun(false)
  }, [])

  // Clear all inputs
  const clearInputs = useCallback(() => {
    setInputs([])
    setResults([])
    setHasRun(false)
  }, [])

  // Run the simulation
  const runSimulation = useCallback(async () => {
    if (inputs.length === 0) {
      addToast({ title: 'Add at least one intervention to simulate', type: 'error' })
      return
    }

    setIsSimulating(true)

    try {
      // Simulate processing time
      await delay(800)

      const newResults: SimulatorResultDisplay[] = []

      // Get baseline sleep score from metrics
      const recentMetrics = metrics.slice(-7)
      const baselineSleepScore = recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.sleepScore, 0) / recentMetrics.length
        : 72

      // Get personal sensitivity from persona
      const personalSensitivity = persona?.dataContext?.evidenceWeight ?? 0.7

      for (const input of inputs) {
        const change = (input.proposedValue - input.currentValue) * personalSensitivity * 0.5
        const projected = baselineSleepScore + change

        newResults.push({
          metric: input.intervention,
          baseline: baselineSleepScore,
          projected,
          change,
          changePercent: (change / baselineSleepScore) * 100,
          certainty: 0.6 + personalSensitivity * 0.2,
          timeToEffect: '3-7 days',
          confidenceInterval: {
            low: projected - 2,
            high: projected + 2,
          },
        })
      }

      setResults(newResults)
      setHasRun(true)
      addToast({ title: 'Simulation complete', type: 'success' })
    } catch (error) {
      addToast({ title: 'Simulation failed', type: 'error' })
      console.error('Simulation error:', error)
    } finally {
      setIsSimulating(false)
    }
  }, [inputs, metrics, persona, addToast])

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setResults([])
    setHasRun(false)
  }, [])

  // Load a preset
  const loadPreset = useCallback((presetName: string) => {
    const preset = SIMULATOR_PRESETS[presetName]
    if (preset) {
      setInputs([...preset])
      setResults([])
      setHasRun(false)
    }
  }, [])

  return {
    inputs,
    results,
    isSimulating,
    hasRun,
    combinedImpact,
    setInput,
    addInput,
    removeInput,
    clearInputs,
    runSimulation,
    resetSimulation,
    loadPreset,
    availablePresets: Object.keys(SIMULATOR_PRESETS),
  }
}

/**
 * Hook for quick What-If check (single intervention)
 */
export function useQuickSimulation(intervention: string) {
  const { activePersonaId } = usePersonaStore()
  const [result, setResult] = useState<SimulatorResultDisplay | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const metrics = useMemo(() => getMetricsForPersona(activePersonaId), [activePersonaId])
  const persona = useMemo(() => getPersonaById(activePersonaId), [activePersonaId])

  const simulate = useCallback(
    async (currentValue: number, proposedValue: number) => {
      setIsSimulating(true)

      await delay(400)

      const recentMetrics = metrics.slice(-7)
      const baseline = recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.sleepScore, 0) / recentMetrics.length
        : 72

      const sensitivity = persona?.dataContext?.evidenceWeight ?? 0.7
      const change = (proposedValue - currentValue) * sensitivity * 0.5
      const projected = baseline + change

      setResult({
        metric: intervention,
        baseline,
        projected,
        change,
        changePercent: (change / baseline) * 100,
        certainty: 0.6 + sensitivity * 0.2,
        timeToEffect: '3-7 days',
        confidenceInterval: {
          low: projected - 2,
          high: projected + 2,
        },
      })

      setIsSimulating(false)
    },
    [intervention, metrics, persona]
  )

  const reset = useCallback(() => {
    setResult(null)
  }, [])

  return { result, isSimulating, simulate, reset }
}

export default useSimulator
