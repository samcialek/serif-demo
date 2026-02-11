import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Activity,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Workflow,
  Layers,
  Target,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { PageLayout, Grid } from '@/components/layout';
import { Card, Button, Badge } from '@/components/common';
import type { ClientUser } from '@/types/client';
import {
  useClientStore,
  useClientSummaries,
  useActiveClient,
  useClientDataSources,
  useClientXVariables,
  useClientYVariables,
  useClientInsights,
  useClientUsers,
  useDataPipelineStats,
} from '@/stores/clientStore';
import type { DataSource, XVariable, YVariable, ClientInsight } from '@/types/client';

// ============================================================================
// Data Source Card Component
// ============================================================================

function DataSourceCard({ source }: { source: DataSource }) {
  const statusColors = {
    active: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusIcons = {
    active: CheckCircle,
    pending: Clock,
    error: AlertCircle,
  };

  const StatusIcon = statusIcons[source.status];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Database className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">{source.name}</h4>
            <p className="text-xs text-gray-500">{source.type}</p>
          </div>
        </div>
        <Badge className={statusColors[source.status]}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {source.status}
        </Badge>
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{source.description}</p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-500">
          <Layers className="w-3 h-3" />
          <span>{formatNumber(source.recordCount || 0)} records</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <RefreshCw className="w-3 h-3" />
          <span>{source.cadence}</span>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-mono truncate" title={source.pipeline}>
          {source.pipeline}
        </p>
      </div>
    </Card>
  );
}

// ============================================================================
// Variable Card Component
// ============================================================================

function VariableCard({
  variable,
  type,
}: {
  variable: XVariable | YVariable;
  type: 'x' | 'y';
}) {
  const isY = type === 'y';
  const yVar = variable as YVariable;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          isY ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}
      >
        {type.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{variable.name}</p>
        <p className="text-xs text-gray-500 truncate">{variable.category}</p>
      </div>
      {!isY && (variable as XVariable).unit && (
        <Badge variant="outline" className="text-xs">
          {(variable as XVariable).unit}
        </Badge>
      )}
      {isY && (
        <Badge
          variant="outline"
          className={`text-xs ${
            yVar.targetDirection === 'increase'
              ? 'text-green-600 border-green-200'
              : yVar.targetDirection === 'decrease'
                ? 'text-red-600 border-red-200'
                : 'text-blue-600 border-blue-200'
          }`}
        >
          {yVar.targetDirection === 'increase' && '↑'}
          {yVar.targetDirection === 'decrease' && '↓'}
          {yVar.targetDirection === 'optimize' && '◎'}
          {yVar.targetDirection === 'maintain' && '→'}
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// Insight Card Component
// ============================================================================

function InsightCard({ insight }: { insight: ClientInsight }) {
  const xVariables = useClientXVariables();
  const yVariables = useClientYVariables();

  const xVars = insight.xVariables
    .map((id) => xVariables.find((v) => v.id === id))
    .filter(Boolean) as XVariable[];
  const yVar = yVariables.find((v) => v.id === insight.yVariable);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <Badge
          className={`text-xs ${
            insight.modelType === 'causal'
              ? 'bg-purple-100 text-purple-700'
              : insight.modelType === 'predictive'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {insight.modelType}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Target className="w-3 h-3" />
          {Math.round(insight.confidence * 100)}% confidence
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{insight.description}</p>

      {/* X → Y Mapping */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {xVars.map((xVar, i) => (
          <span key={xVar.id}>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              {xVar.name}
            </Badge>
            {i < xVars.length - 1 && <span className="text-gray-400 mx-1">+</span>}
          </span>
        ))}
        <ArrowRight className="w-4 h-4 text-gray-400" />
        {yVar && (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
            {yVar.name}
          </Badge>
        )}
      </div>

      {/* θ/β Parameters */}
      {(insight.theta !== undefined || insight.beta !== undefined) && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          {insight.theta !== undefined && (
            <span>
              θ = <span className="font-mono text-gray-700">{insight.theta}</span>
            </span>
          )}
          {insight.beta !== undefined && (
            <span>
              β = <span className="font-mono text-gray-700">{insight.beta}</span>
            </span>
          )}
        </div>
      )}

      {/* Recommendation */}
      {insight.recommendation && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-primary-600 flex items-start gap-1">
            <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {insight.recommendation}
          </p>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// Expandable User Card Component - Full width, collapsed by default
// ============================================================================

function ExpandableUserCard({ user, clientId }: { user: ClientUser; clientId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const complianceColor = user.complianceRate >= 90
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : user.complianceRate >= 70
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-rose-600 bg-rose-50 border-rose-200';

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Collapsed Header - Always visible */}
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
          {user.avatar || user.name.charAt(0)}
        </div>

        {/* Name & Phase */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-800 truncate">{user.name}</h4>
          <p className="text-xs text-slate-500">{user.currentPhase}</p>
        </div>

        {/* Key Stats - Compact */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Active Days */}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">{user.activeDays}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Days</p>
          </div>

          {/* Compliance */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${complianceColor}`}>
            {user.complianceRate}%
          </div>

          {/* Data Sources Count */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Database className="w-3.5 h-3.5" />
            <span>{user.dataSources?.length || 0}</span>
          </div>
        </div>

        {/* Expand/Collapse Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronRight className={`w-5 h-5 text-slate-400 transform rotate-90`} />
        </motion.div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/30">
              {/* Tags */}
              {user.tags.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-lg font-semibold text-slate-800">{user.activeDays}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Active Days</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-lg font-semibold text-slate-800">{user.complianceRate}%</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Compliance</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-lg font-semibold text-slate-800">{user.insightCount || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Insights</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <p className="text-lg font-semibold text-slate-800">{user.dataSources?.length || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Data Sources</p>
                </div>
              </div>

              {/* Data Sources */}
              {user.dataSources && user.dataSources.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Connected Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {user.dataSources.map((source) => (
                      <div
                        key={source}
                        className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Details Link */}
              <Link
                to={`/clients/${clientId}/users/${user.id}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-600 text-sm font-medium rounded-lg transition-colors"
              >
                View Full Profile
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ============================================================================
// Client Overview Card
// ============================================================================

function ClientOverviewCard({
  client,
  onSelect,
  isSelected,
}: {
  client: ReturnType<typeof useClientSummaries>[0];
  onSelect: () => void;
  isSelected: boolean;
}) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <Card
      className={`p-6 cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-primary-500 bg-primary-50/50'
          : 'hover:shadow-lg hover:border-primary-200'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{client.logo}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
            <p className="text-sm text-gray-500">Enterprise Client</p>
          </div>
        </div>
        <ChevronRight
          className={`w-5 h-5 transition-transform ${isSelected ? 'rotate-90 text-primary-600' : 'text-gray-400'}`}
        />
      </div>

      <Grid columns={2} gap="sm" className="mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Database className="w-4 h-4" />
            <span className="text-xs">Data Sources</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{client.dataSourceCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-xs">Total Records</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(client.totalRecords)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs">X Variables</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{client.xVariableCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs">Y Variables</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{client.yVariableCount}</p>
        </div>
      </Grid>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Zap className="w-4 h-4 text-primary-500" />
          <span>{client.insightCount} Active Insights</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Users className="w-4 h-4" />
          <span>{client.userCount} Users</span>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Main View
// ============================================================================

export function ClientsView() {
  const clientSummaries = useClientSummaries();
  const activeClient = useActiveClient();
  const dataSources = useClientDataSources();
  const xVariables = useClientXVariables();
  const yVariables = useClientYVariables();
  const insights = useClientInsights();
  const users = useClientUsers();
  const pipelineStats = useDataPipelineStats();

  const { setActiveClient, activeClientId, viewMode, setViewMode } = useClientStore();

  const [showAllSources, setShowAllSources] = useState(false);
  const [showAllVariables, setShowAllVariables] = useState(false);

  // Auto-select first client if none selected
  useEffect(() => {
    if (!activeClientId && clientSummaries.length > 0) {
      setActiveClient(clientSummaries[0].id);
    }
  }, [activeClientId, clientSummaries, setActiveClient]);

  const visibleSources = showAllSources ? dataSources : dataSources.slice(0, 6);
  const visibleXVars = showAllVariables ? xVariables : xVariables.slice(0, 8);
  const visibleYVars = yVariables.slice(0, 5);

  return (
    <PageLayout
      title="Enterprise Clients"
      subtitle="Data infrastructure and causal insights for enterprise partners"
      actions={
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Workflow className="w-4 h-4 mr-1" />
            {clientSummaries.length} Active Clients
          </Badge>
        </div>
      }
    >
      {/* Client Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Grid columns={2} gap="lg">
          {clientSummaries.map((client) => (
            <ClientOverviewCard
              key={client.id}
              client={client}
              onSelect={() => setActiveClient(client.id)}
              isSelected={activeClientId === client.id}
            />
          ))}
        </Grid>
      </motion.div>

      {/* Selected Client Details */}
      {activeClient && (
        <motion.div
          key={activeClient.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Client Header */}
          <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{activeClient.logo}</span>
              <div>
                <h2 className="text-2xl font-bold">{activeClient.name}</h2>
                <p className="text-gray-300">{activeClient.description}</p>
              </div>
            </div>

            {/* Pipeline Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-3xl font-bold">{pipelineStats.totalSources}</p>
                <p className="text-sm text-gray-300">Data Sources</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-3xl font-bold">
                  {pipelineStats.totalRecords >= 1000000
                    ? `${(pipelineStats.totalRecords / 1000000).toFixed(1)}M`
                    : `${(pipelineStats.totalRecords / 1000).toFixed(0)}K`}
                </p>
                <p className="text-sm text-gray-300">Total Records</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-3xl font-bold">{pipelineStats.activeCount}</p>
                <p className="text-sm text-gray-300">Active Pipelines</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-3xl font-bold">{insights.length}</p>
                <p className="text-sm text-gray-300">Causal Insights</p>
              </div>
            </div>
          </Card>

          {/* Partner Value Dashboard - Serif Impact Metrics (Human Edge Only) */}
          {activeClientId === 'human-edge' && (
          <Card className="p-6 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Serif Impact Dashboard</h3>
                  <p className="text-sm text-slate-500">Human Edge pilot metrics since integration (6 weeks)</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Live Pilot
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* Retention Lift */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Retention Lift</span>
                  <span className="text-xs text-emerald-600 font-medium">vs baseline</span>
                </div>
                <p className="text-4xl font-bold text-emerald-600">3.2x</p>
                <p className="text-xs text-slate-500 mt-1">Users with Serif insights</p>
              </div>

              {/* Daily Engagement */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Daily Opens</span>
                  <span className="text-xs text-emerald-600 font-medium">+242%</span>
                </div>
                <p className="text-4xl font-bold text-slate-800">4.1x</p>
                <p className="text-xs text-slate-500 mt-1">vs 1.2x industry avg</p>
              </div>

              {/* 30-Day Retention */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">30-Day Retention</span>
                  <span className="text-xs text-emerald-600 font-medium">+8pp</span>
                </div>
                <p className="text-4xl font-bold text-slate-800">92%</p>
                <p className="text-xs text-slate-500 mt-1">vs 84% industry avg</p>
              </div>

              {/* Cost Savings */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Build vs Buy</span>
                  <span className="text-xs text-emerald-600 font-medium">saved</span>
                </div>
                <p className="text-4xl font-bold text-slate-800">$58K</p>
                <p className="text-xs text-slate-500 mt-1">/month vs in-house team</p>
              </div>
            </div>

            {/* Value Summary */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-primary-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Serif's causal intelligence layer has increased user retention by 3.2x while reducing development costs by 85%.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Integration completed in 6 weeks vs 18-24 month internal build estimate.
                  </p>
                </div>
              </div>
            </div>
          </Card>
          )}

          {/* Partner Value Dashboard - Serif Impact Metrics (Habit Bandz Only) */}
          {activeClientId === 'habit-bandz' && (
          <Card className="p-6 border-2 border-violet-200 bg-gradient-to-br from-violet-50/50 to-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Serif Impact Dashboard</h3>
                  <p className="text-sm text-slate-500">Habit Bandz pilot metrics since integration (3 weeks)</p>
                </div>
              </div>
              <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                <Clock className="w-3 h-3 mr-1" />
                Early Pilot
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* Streak Survival */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Streak Survival</span>
                  <span className="text-xs text-violet-600 font-medium">vs baseline</span>
                </div>
                <p className="text-4xl font-bold text-violet-600">2.8x</p>
                <p className="text-xs text-slate-500 mt-1">Avg 11 days vs 4 days</p>
              </div>

              {/* 30-Day Retention */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">30-Day Retention</span>
                  <span className="text-xs text-violet-600 font-medium">+33pp</span>
                </div>
                <p className="text-4xl font-bold text-slate-800">78%</p>
                <p className="text-xs text-slate-500 mt-1">vs 45% habit app avg</p>
              </div>

              {/* Completion Rate */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completion Lift</span>
                  <span className="text-xs text-violet-600 font-medium">+34%</span>
                </div>
                <p className="text-4xl font-bold text-slate-800">+34%</p>
                <p className="text-xs text-slate-500 mt-1">Daily habit completion</p>
              </div>

              {/* Cost Savings */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Build vs Buy</span>
                  <span className="text-xs text-violet-600 font-medium">saved</span>
                </div>
                <p className="text-4xl font-bold text-slate-800">$42K</p>
                <p className="text-xs text-slate-500 mt-1">/month vs in-house ML</p>
              </div>
            </div>

            {/* Value Summary */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-violet-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Serif's causal insights have increased average streak length from 4 days to 11 days, driving 2.8x improvement in habit success rates.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Cross-platform insight: Sleep data from wearables predicts next-day habit completion with 79% accuracy.
                  </p>
                </div>
              </div>
            </div>
          </Card>
          )}

          {/* Data Sources */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-600" />
                Data Sources & Pipelines
              </h3>
              {dataSources.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllSources(!showAllSources)}
                >
                  {showAllSources ? 'Show Less' : `Show All (${dataSources.length})`}
                </Button>
              )}
            </div>
            <Grid columns={3} gap="md">
              {visibleSources.map((source) => (
                <DataSourceCard key={source.id} source={source} />
              ))}
            </Grid>
          </div>

          {/* Variables: X → Y */}
          <div className="grid grid-cols-2 gap-8">
            {/* X Variables */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    X
                  </span>
                  Predictor Variables ({xVariables.length})
                </h3>
                {xVariables.length > 8 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllVariables(!showAllVariables)}
                  >
                    {showAllVariables ? 'Show Less' : `Show All`}
                  </Button>
                )}
              </div>
              <Card className="p-4">
                <div className="space-y-2">
                  {visibleXVars.map((v) => (
                    <VariableCard key={v.id} variable={v} type="x" />
                  ))}
                  {!showAllVariables && xVariables.length > 8 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      +{xVariables.length - 8} more variables
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Y Variables */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                  Y
                </span>
                Outcome Variables ({yVariables.length})
              </h3>
              <Card className="p-4">
                <div className="space-y-2">
                  {visibleYVars.map((v) => (
                    <VariableCard key={v.id} variable={v} type="y" />
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Causal Insights */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary-600" />
              Causal Insights (X → Y Relationships)
            </h3>
            <Grid columns={2} gap="md">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </Grid>
          </div>

          {/* Users Section - Full width, expandable cards */}
          {users.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  Patient Overview ({users.length})
                </h3>
                <p className="text-xs text-slate-500">Click to expand details</p>
              </div>
              <div className="space-y-3">
                {users.map((user) => (
                  <ExpandableUserCard key={user.id} user={user} clientId={activeClientId!} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </PageLayout>
  );
}

export default ClientsView;
