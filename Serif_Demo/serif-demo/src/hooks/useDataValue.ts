import { useMemo } from 'react'
import edgeSummaryRaw from '@/data/dataValue/edgeSummaryRaw.json'
import {
  getAvailableColumns,
  getCurrentlyTestableEdges,
  rankCandidates,
  buildExistingSourceRoster,
  computeSummaryStats,
} from '@/data/dataValue/marginalValueEngine'
import type { EdgeResult } from '@/data/dataValue/types'

export function useDataValue() {
  const edgeResults = edgeSummaryRaw as EdgeResult[]
  const availableColumns = useMemo(() => getAvailableColumns(), [])

  const { testable: testableEdges, untestable: untestableEdges } = useMemo(
    () => getCurrentlyTestableEdges(availableColumns),
    [availableColumns]
  )

  const rankedCandidates = useMemo(
    () => rankCandidates(availableColumns, edgeResults),
    [availableColumns, edgeResults]
  )

  const existingSources = useMemo(
    () => buildExistingSourceRoster(edgeResults),
    [edgeResults]
  )

  const summary = useMemo(
    () => computeSummaryStats(edgeResults),
    [edgeResults]
  )

  return {
    edgeResults,
    existingSources,
    rankedCandidates,
    testableEdges,
    untestableEdges,
    ...summary,
  }
}
