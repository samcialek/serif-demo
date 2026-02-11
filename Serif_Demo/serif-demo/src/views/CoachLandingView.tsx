import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Lightbulb,
  ListChecks,
  TrendingDown,
  User,
  ChevronRight,
  Zap,
  ClipboardList,
  Activity,
} from 'lucide-react'
import { PageLayout, Grid } from '@/components/layout'
import { Card, Badge } from '@/components/common'
import { usePersonaStore } from '@/stores/personaStore'
import { getAllPersonas } from '@/data/personas'
import { getFilteredInsights, getTopInsights } from '@/data/insights'
import { getProtocolsForPersona } from '@/data/protocols'

// CLINICAL PRECISION: Soft, refined color schemes using Serif palette
const patientColors = [
  { primary: 'rgb(var(--color-primary-500))', light: 'rgb(var(--color-primary-100))', bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-600' },
  { primary: 'rgb(var(--color-secondary-500))', light: 'rgb(var(--color-secondary-100))', bg: 'bg-secondary-50', border: 'border-secondary-200', text: 'text-secondary-600' },
  { primary: 'rgb(var(--color-accent-500))', light: 'rgb(var(--color-accent-100))', bg: 'bg-accent-50', border: 'border-accent-200', text: 'text-accent-600' },
  { primary: '#10B981', light: '#D1FAE5', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  { primary: '#6366F1', light: '#E0E7FF', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
  { primary: '#8B5CF6', light: '#EDE9FE', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600' },
]

export function CoachLandingView() {
  const navigate = useNavigate()
  const personas = getAllPersonas()
  const setActivePersona = usePersonaStore(state => state.setActivePersona)

  // Calculate alert-focused metrics
  const allInsightsData = personas.map(p => {
    const insights = getFilteredInsights({ personaId: p.id, minCertainty: 0.6 })
    const outsideSafeguards = insights.filter(i =>
      i.causalParams?.currentStatus && i.causalParams.currentStatus !== 'at_optimal'
    )
    return { personaId: p.id, insights, outsideSafeguards }
  })

  const totalInsights = allInsightsData.reduce((acc, d) => acc + d.insights.length, 0)
  const insightsOutsideSafeguards = allInsightsData.reduce((acc, d) => acc + d.outsideSafeguards.length, 0)

  const protocolsData = personas.map(p => {
    const protocols = getProtocolsForPersona(p.id)
    return {
      personaId: p.id,
      protocols,
      active: protocols.filter(pr => pr.status === 'active'),
      needsReview: protocols.filter(pr => pr.status === 'suggested' || !pr.status),
    }
  })

  const protocolsNeedingReview = protocolsData.reduce((acc, d) => acc + d.needsReview.length, 0)
  const totalActiveProtocols = protocolsData.reduce((acc, d) => acc + d.active.length, 0)

  // Count patients with deviations from their personal thresholds
  const patientsWithDeviations = allInsightsData.filter(d => d.outsideSafeguards.length > 0).length

  const handleNavigate = (patientId: string, path: string) => {
    setActivePersona(patientId)
    navigate(path)
  }

  // CLINICAL PRECISION: Alert-focused summary stats with soft Serif colors
  const summaryStats = [
    {
      icon: AlertTriangle,
      label: 'Outside Safeguards',
      value: insightsOutsideSafeguards,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      urgent: insightsOutsideSafeguards > 0
    },
    {
      icon: Lightbulb,
      label: 'Total Insights',
      value: totalInsights,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-100'
    },
    {
      icon: ClipboardList,
      label: 'Protocols to Review',
      value: protocolsNeedingReview,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      urgent: protocolsNeedingReview > 0
    },
    {
      icon: TrendingDown,
      label: 'Patients Deviating',
      value: patientsWithDeviations,
      subtitle: `of ${personas.length}`,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-100'
    },
  ]

  return (
    <PageLayout maxWidth="2xl" padding="lg">
      {/* CLINICAL PRECISION: Coach Header with soft Serif styling */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 mb-1">Good morning, Dr. Hoon</h1>
            <p className="text-slate-500">
              You have <span className="font-medium text-primary-600">{personas.length} patients</span> with new insights today
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 border border-primary-100 rounded-xl">
            <Zap className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-primary-600">All Patients Dashboard</span>
          </div>
        </div>
      </motion.div>

      {/* CLINICAL PRECISION: Alert Summary Row with soft cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <Grid columns={4} gap="md">
          {summaryStats.map((stat, index) => {
            const Icon = stat.icon
            const isUrgent = 'urgent' in stat && stat.urgent
            return (
              <Card
                key={index}
                className={`p-4 rounded-xl border transition-all ${
                  isUrgent
                    ? 'ring-1 ring-amber-200 bg-amber-50/30 border-amber-200'
                    : `bg-white/80 ${stat.borderColor}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${stat.bgColor} ${stat.borderColor}`}>
                    <Icon className={'w-5 h-5 ' + stat.color} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <p className={`text-2xl font-semibold ${isUrgent ? stat.color : 'text-slate-800'}`}>
                        {stat.value}
                      </p>
                      {'subtitle' in stat && stat.subtitle && (
                        <span className="text-sm text-slate-400">{stat.subtitle}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </Grid>
      </motion.div>

      {/* CLINICAL PRECISION: Patient Cards Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-primary-50 border border-primary-100 rounded-xl">
            <User className="w-5 h-5 text-primary-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Patient Overview</h2>
        </div>

        <Grid columns={2} gap="lg">
          {personas.map((patient, index) => {
            const colorScheme = patientColors[index % patientColors.length]
            const insights = getFilteredInsights({ personaId: patient.id, minCertainty: 0.6 })
            const protocols = getProtocolsForPersona(patient.id)
            const activeProtocols = protocols.filter(p => p.status === 'active')

            // Get insights where patient is deviating from their thresholds
            const deviatingInsights = insights.filter(i =>
              i.causalParams?.currentStatus && i.causalParams.currentStatus !== 'at_optimal'
            ).slice(0, 3) // Show top 3 deviations

            // Determine protocol status
            const hasActiveProtocol = activeProtocols.length > 0
            const isStillCollecting = patient.daysOfData < 30 || insights.length < 3
            const protocolStatus = hasActiveProtocol
              ? 'Active Protocol'
              : isStillCollecting
                ? 'Still Collecting Insights'
                : 'Ready for Protocol'

            const getStatusColor = () => {
              if (hasActiveProtocol) return 'bg-emerald-100 text-emerald-700'
              if (isStillCollecting) return 'bg-amber-100 text-amber-700'
              return 'bg-blue-100 text-blue-700'
            }

            const getDeviationIcon = (status: string) => {
              if (status === 'above_optimal') return <TrendingDown className="w-3 h-3 rotate-180" />
              return <TrendingDown className="w-3 h-3" />
            }

            return (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                {/* CLINICAL PRECISION: Soft rounded cards with visible color tint */}
                <Card className={`p-5 rounded-xl hover:shadow-md transition-all border-2 ${colorScheme.border} ${colorScheme.bg}`}>
                  {/* Header with patient info and protocol status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorScheme.border} ${colorScheme.bg}`}
                      >
                        <User className={`w-6 h-6 ${colorScheme.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{patient.name}</h3>
                        <p className="text-sm text-slate-500">{patient.archetype}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                        {protocolStatus}
                      </span>
                      <span className="text-xs text-slate-400">{patient.daysOfData} days of data</span>
                    </div>
                  </div>

                  {/* CLINICAL PRECISION: Deviation Alerts with soft styling */}
                  {deviatingInsights.length > 0 ? (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-slate-600">Deviating from Trend</span>
                      </div>
                      {deviatingInsights.map((insight) => {
                        const status = insight.causalParams?.currentStatus || 'below_optimal'
                        const isAbove = status === 'above_optimal'
                        return (
                          <div
                            key={insight.id}
                            className="p-3 bg-amber-50/70 rounded-xl border border-amber-100"
                          >
                            <div className="flex items-start gap-2">
                              <div className={`p-1.5 rounded-lg ${isAbove ? 'bg-rose-100 border border-rose-200' : 'bg-sky-100 border border-sky-200'}`}>
                                {getDeviationIcon(status)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">
                                  {insight.causalParams?.source?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || insight.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {isAbove ? 'Above' : 'Below'} optimal threshold
                                  {insight.causalParams?.theta?.displayValue && (
                                    <span className="text-amber-600 font-medium"> ({insight.causalParams.theta.displayValue})</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600 font-medium">All metrics within optimal range</span>
                      </div>
                    </div>
                  )}

                  {/* CLINICAL PRECISION: Quick Stats Row */}
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-primary-400" />
                      {insights.length} insights
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-secondary-400" />
                      {activeProtocols.length} protocols
                    </span>
                    {deviatingInsights.length > 0 && (
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {deviatingInsights.length} alerts
                      </span>
                    )}
                  </div>

                  {/* CLINICAL PRECISION: Action Buttons with soft styling */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleNavigate(patient.id, '/insights')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all border ${colorScheme.bg} ${colorScheme.border} ${colorScheme.text} hover:shadow-sm`}
                    >
                      <Lightbulb className="w-4 h-4" />
                      Insights
                    </button>
                    <button
                      onClick={() => handleNavigate(patient.id, '/protocols')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all border ${colorScheme.bg} ${colorScheme.border} ${colorScheme.text} hover:shadow-sm`}
                    >
                      <ListChecks className="w-4 h-4" />
                      Protocols
                    </button>
                    <button
                      onClick={() => handleNavigate(patient.id, '/integration')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all border ${colorScheme.bg} ${colorScheme.border} ${colorScheme.text} hover:shadow-sm`}
                    >
                      <ChevronRight className="w-4 h-4" />
                      Devices
                    </button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </Grid>
      </motion.div>
    </PageLayout>
  )
}

export default CoachLandingView
