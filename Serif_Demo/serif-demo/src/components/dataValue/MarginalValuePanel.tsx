import { CandidateSourceCard } from './CandidateSourceCard'
import type { CandidateDataSource, MarginalValueScore } from '@/data/dataValue/types'

interface MarginalValuePanelProps {
  rankedCandidates: Array<{ candidate: CandidateDataSource; score: MarginalValueScore }>
}

export function MarginalValuePanel({ rankedCandidates }: MarginalValuePanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Ranked Data Opportunities</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Each candidate scored 0-100 based on new edges unlocked, confounders resolved, and signal boost potential.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rankedCandidates.map(({ candidate, score }) => (
          <CandidateSourceCard
            key={candidate.id}
            candidate={candidate}
            score={score}
          />
        ))}
      </div>
    </div>
  )
}
