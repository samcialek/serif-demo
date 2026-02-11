import type { Persona, Insight, DailyMetrics, LabResult, Protocol, DailyPlan } from '@/types'
import type { PersonaData, PersonaRegistryEntry } from './types'

// Import all persona data
import {
  rajanPersona,
  rajanInsights,
  rajanMetrics,
  rajanLabs,
  rajanProtocols,
  rajanDailyPlan,
} from './rajan'

import {
  sarahPersona,
  sarahInsights,
  sarahMetrics,
  sarahLabs,
  sarahProtocols,
  sarahDailyPlan,
} from './sarah'

import {
  marcusPersona,
  marcusInsights,
  marcusMetrics,
  marcusLabs,
  marcusProtocols,
  marcusDailyPlan,
} from './marcus'

import {
  emmaPersona,
  emmaInsights,
  emmaMetrics,
  emmaLabs,
  emmaProtocols,
  emmaDailyPlan,
} from './emma'

import {
  oronPersona,
  oronInsights,
  oronMetrics,
  oronLabs,
  oronProtocols,
  oronDailyPlan,
} from './oron'

// Export individual personas
export {
  rajanPersona,
  rajanInsights,
  rajanMetrics,
  rajanLabs,
  rajanProtocols,
  rajanDailyPlan,
  sarahPersona,
  sarahInsights,
  sarahMetrics,
  sarahLabs,
  sarahProtocols,
  sarahDailyPlan,
  marcusPersona,
  marcusInsights,
  marcusMetrics,
  marcusLabs,
  marcusProtocols,
  marcusDailyPlan,
  emmaPersona,
  emmaInsights,
  emmaMetrics,
  emmaLabs,
  emmaProtocols,
  emmaDailyPlan,
  oronPersona,
  oronInsights,
  oronMetrics,
  oronLabs,
  oronProtocols,
  oronDailyPlan,
}

// Aggregated exports — Oron only
export const personas: Persona[] = [
  oronPersona,
]

export const allInsights: Insight[] = [
  ...oronInsights,
]

export const allProtocols: Protocol[] = [
  ...oronProtocols,
]

// Complete persona data bundles — Oron only
export const personaDataMap: Record<string, PersonaData> = {
  oron: {
    persona: oronPersona,
    insights: oronInsights,
    metrics: oronMetrics,
    labs: oronLabs,
    protocols: oronProtocols,
    dailyPlan: oronDailyPlan,
  },
}

// Quick lookup registry
export const personaRegistry: PersonaRegistryEntry[] = personas.map(p => ({
  id: p.id,
  name: p.name,
  archetype: p.archetype,
  avatar: p.avatar,
  tags: p.tags,
}))

// Helper functions
export function getAllPersonas(): Persona[] {
  return personas
}

export function getPersonaById(id: string): Persona | undefined {
  return personas.find(p => p.id === id)
}

export function getPersonaData(id: string): PersonaData | undefined {
  return personaDataMap[id]
}

export function getInsightsForPersona(personaId: string): Insight[] {
  return allInsights.filter(i => i.personaId === personaId)
}

export function getProtocolsForPersona(personaId: string): Protocol[] {
  return allProtocols.filter(p => p.personaId === personaId)
}

export function getMetricsForPersona(personaId: string): DailyMetrics[] {
  return personaDataMap[personaId]?.metrics ?? []
}

export function getLabsForPersona(personaId: string): LabResult[] {
  return personaDataMap[personaId]?.labs ?? []
}

export function getDailyPlanForPersona(personaId: string): DailyPlan | undefined {
  return personaDataMap[personaId]?.dailyPlan
}

// Re-export types
export type { PersonaData, PersonaRegistryEntry } from './types'
