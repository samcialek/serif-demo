import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout'
import {
  LandingView,
  CoachLandingView,
  IntegrationView,
  InsightsView,
  ProtocolsView,
  CoachView,
  ApiView,
  AdminView,
  ClientsView,
  UserDetailView,
  DataView,
  StyleDemoView,
  CurveStyleDemoView,
} from '@/views'

function App() {
  return (
    <BrowserRouter basename="/serif-demo">
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<CoachLandingView />} />
          <Route path="/clients" element={<ClientsView />} />
          <Route path="/clients/:clientId/users/:userId" element={<UserDetailView />} />
          <Route path="/data" element={<DataView />} />
          <Route path="/integration" element={<IntegrationView />} />
          <Route path="/insights" element={<InsightsView />} />
          <Route path="/protocols" element={<ProtocolsView />} />
          <Route path="/coach" element={<CoachView />} />
          <Route path="/api" element={<ApiView />} />
          <Route path="/admin" element={<AdminView />} />
          <Route path="/style-demo" element={<StyleDemoView />} />
          <Route path="/curve-demo" element={<CurveStyleDemoView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
