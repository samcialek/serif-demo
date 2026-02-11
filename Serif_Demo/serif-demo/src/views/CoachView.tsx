import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Target,
  Activity,
  Sparkles,
  Brain,
  Heart,
  Moon,
  Zap
} from 'lucide-react'
import { PageLayout, Section, Grid, SplitLayout } from '@/components/layout'
import { Card, Badge, Button, TabGroup } from '@/components/common'
import { CertaintyIndicator, EvidenceWeight } from '@/components/charts'
import { getCoachMembers, getSessionPreps, getCoachWeeklySummary } from '@/data/coach'

// Status configuration matching Serif website
const statusConfig = {
  'action-required': {
    label: 'Action Required',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle
  },
  'needs-support': {
    label: 'Needs Support',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: AlertTriangle
  },
  'on-track': {
    label: 'On Track',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle
  },
}

// Mock causal drivers for demo
const getCausalDriversForMember = (memberId: string) => [
  {
    driver: 'Sleep consistency',
    effectSize: '+18%',
    confidence: '85-92%',
    direction: 'positive',
    icon: Moon
  },
  {
    driver: 'Evening caffeine',
    effectSize: '-12%',
    confidence: '78-88%',
    direction: 'negative',
    icon: Zap
  },
  {
    driver: 'Morning HRV',
    effectSize: '+8%',
    confidence: '72-84%',
    direction: 'positive',
    icon: Heart
  },
  {
    driver: 'Screen time before bed',
    effectSize: '-6%',
    confidence: '68-79%',
    direction: 'negative',
    icon: Brain
  },
]

// Health archetypes matching Serif website
const archetypes = {
  'slow-metabolizer': { label: 'Slow Metabolizer', color: 'text-purple-600', bg: 'bg-purple-100' },
  'high-responder': { label: 'High Responder', color: 'text-primary-600', bg: 'bg-primary-100' },
  'stress-sensitive': { label: 'Stress Sensitive', color: 'text-amber-600', bg: 'bg-amber-100' },
  'recovery-optimized': { label: 'Recovery Optimized', color: 'text-green-600', bg: 'bg-green-100' },
}

export function CoachView() {
  const [activeTab, setActiveTab] = useState<'roster' | 'sessions' | 'digest'>('roster')
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  const members = getCoachMembers()
  const sessionPrepsList = getSessionPreps()
  const digest = getCoachWeeklySummary()

  // Enhanced members with status and archetypes for demo
  const enhancedMembers = members.map((member, i) => ({
    ...member,
    coachStatus: i === 0 ? 'action-required' : i === 1 ? 'needs-support' : 'on-track',
    archetype: Object.keys(archetypes)[i % 4] as keyof typeof archetypes,
    traitModifiers: ['Caffeine sensitive', 'Morning chronotype'].slice(0, (i % 2) + 1),
    lastUpdate: `${Math.floor(Math.random() * 24) + 1}h ago`,
  }))

  const tabs = [
    { value: 'roster', label: 'Member Overview', count: members.length },
    { value: 'sessions', label: 'Session Prep', count: sessionPrepsList.length },
    { value: 'digest', label: 'Weekly Digest' },
  ]

  const statusCounts = {
    'action-required': enhancedMembers.filter(m => m.coachStatus === 'action-required').length,
    'needs-support': enhancedMembers.filter(m => m.coachStatus === 'needs-support').length,
    'on-track': enhancedMembers.filter(m => m.coachStatus === 'on-track').length,
  }

  return (
    <PageLayout
      title="Coach Dashboard"
      subtitle="Member insights, session prep, and causal intelligence"
    >
      {/* Status Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Grid columns={3} gap="md">
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon
            const count = statusCounts[key as keyof typeof statusCounts]
            return (
              <Card
                key={key}
                className={`p-4 ${config.bgColor} ${config.borderColor} border cursor-pointer hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/80`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
                    <p className="text-sm text-gray-600">{config.label}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </Grid>
      </motion.div>

      <TabGroup
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as typeof activeTab)}
        variant="underline"
        className="mb-6"
      />

      {activeTab === 'roster' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="space-y-4">
            {enhancedMembers.map((member) => {
              const status = statusConfig[member.coachStatus as keyof typeof statusConfig]
              const StatusIcon = status.icon
              const archetype = archetypes[member.archetype]
              const causalDrivers = getCausalDriversForMember(member.id)

              return (
                <Card
                  key={member.id}
                  className={`p-5 ${selectedMember === member.id ? 'ring-2 ring-primary-500' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          <Badge className={`${archetype.bg} ${archetype.color} border-0`}>
                            {archetype.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500">{member.focus}</p>
                          {member.traitModifiers.map((trait, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${status.bgColor}`}>
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                      </div>
                      <span className="text-xs text-gray-500">{member.lastUpdate}</span>
                    </div>
                  </div>

                  {/* Member Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{member.daysOfData}</div>
                      <div className="text-xs text-gray-500">Days of Data</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{member.insightCount}</div>
                      <div className="text-xs text-gray-500">Insights</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{member.activeProtocols}</div>
                      <div className="text-xs text-gray-500">Active Protocols</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-primary-600">{Math.round(75 + Math.random() * 20)}%</div>
                      <div className="text-xs text-gray-500">Evidence Weight</div>
                    </div>
                  </div>

                  {/* Ranked Causal Drivers */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-500" />
                      Top Causal Drivers
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {causalDrivers.slice(0, 4).map((driver, i) => {
                        const DriverIcon = driver.icon
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              driver.direction === 'positive' ? 'bg-green-50' : 'bg-red-50'
                            }`}
                          >
                            <DriverIcon className={`w-4 h-4 ${
                              driver.direction === 'positive' ? 'text-green-600' : 'text-red-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{driver.driver}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${
                                  driver.direction === 'positive' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {driver.effectSize}
                                </span>
                                <span className="text-xs text-gray-500">CrI: {driver.confidence}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                  >
                    {selectedMember === member.id ? 'Collapse' : 'View Full Profile'}
                    <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${selectedMember === member.id ? 'rotate-90' : ''}`} />
                  </Button>
                </Card>
              )
            })}
          </div>
        </motion.div>
      )}

      {activeTab === 'sessions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid gap-4 lg:grid-cols-2" data-tour="session-prep">
            {sessionPrepsList.map((prep) => (
              <Card key={prep.id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {prep.clientName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{prep.clientName}</h3>
                      <p className="text-sm text-gray-500">{prep.focus}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={prep.urgency === 'high' ? 'warning' : 'default'}>
                      {prep.urgency} priority
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {prep.sessionTime}
                    </p>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {prep.keyMetrics.slice(0, 3).map((metric, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-semibold text-gray-900">{metric.value}</div>
                      <div className="text-xs text-gray-500">{metric.label}</div>
                      {metric.trend && (
                        <div className={`text-xs flex items-center justify-center gap-1 ${metric.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {metric.trend}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Celebration Points */}
                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Celebration Points
                  </h4>
                  <ul className="space-y-1">
                    <li className="text-sm text-green-700">3 consecutive days of sleep goal achieved</li>
                    <li className="text-sm text-green-700">HRV trending up 12% this week</li>
                  </ul>
                </div>

                {/* Intervention Suggestions */}
                <div className="mb-4 p-3 bg-primary-50 border border-primary-100 rounded-lg">
                  <h4 className="text-sm font-medium text-primary-800 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Suggested Interventions
                  </h4>
                  <ul className="space-y-1">
                    {prep.discussionPoints.slice(0, 2).map((point, i) => (
                      <li key={i} className="text-sm text-primary-700">
                        {typeof point === 'string' ? point : point.title}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Alerts */}
                {prep.alerts && prep.alerts.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-amber-700 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Attention Needed</span>
                    </div>
                    <ul className="mt-1 text-xs text-amber-600">
                      {prep.alerts.map((alert, i) => (
                        <li key={i}>• {alert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button size="sm" variant="outline" fullWidth>
                  View Full Prep
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'digest' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Summary Hero */}
          <Card className="p-6 bg-gradient-to-r from-navy-900 to-navy-800 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">This Week's Impact</h3>
                <p className="text-gray-300">Your coaching generated measurable improvements</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-primary-400">+14%</p>
                <p className="text-sm text-gray-300">Avg. Outcome Improvement</p>
              </div>
            </div>
          </Card>

          <Grid columns={2} gap="md">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                Weekly Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Total Sessions</span>
                  <span className="text-xl font-bold text-gray-900">{digest.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">New Insights Generated</span>
                  <span className="text-xl font-bold text-gray-900">{digest.newInsights}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Protocols Started</span>
                  <span className="text-xl font-bold text-gray-900">{digest.protocolsStarted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Member Certainty</span>
                  <span className="text-xl font-bold text-primary-600">{digest.avgCertainty}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Members Needing Attention
              </h3>
              <div className="space-y-3">
                {digest.needsAttention.map((client, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-xs text-amber-600">{client.reason}</p>
                      </div>
                    </div>
                    <Button size="xs" variant="outline">Review</Button>
                  </div>
                ))}
              </div>
            </Card>
          </Grid>

          <Section title="Top Performing Protocols This Week" className="mt-6">
            <Grid columns={3} gap="md">
              {digest.topProtocols.map((protocol, i) => (
                <Card key={i} className="p-4 hover:border-primary-200 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-100 rounded">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900">{protocol.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{protocol.clients} members enrolled</p>
                  <p className="text-sm font-semibold text-green-600">{protocol.improvement} avg improvement</p>
                </Card>
              ))}
            </Grid>
          </Section>

          {/* Causal Insights Summary */}
          <Section title="Top Causal Discoveries This Week" className="mt-6">
            <Card className="p-5">
              <div className="space-y-3">
                {[
                  { insight: 'Sleep consistency shows 2.3x stronger effect than duration alone', confidence: '91%', members: 8 },
                  { insight: 'Evening screen cutoff improving outcomes for stress-sensitive archetypes', confidence: '87%', members: 5 },
                  { insight: 'Morning protein timing correlating with sustained energy levels', confidence: '82%', members: 6 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.insight}</p>
                        <p className="text-xs text-gray-500">Observed in {item.members} members</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-primary-600 border-primary-200">
                      {item.confidence} confidence
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        </motion.div>
      )}
    </PageLayout>
  )
}

export default CoachView
