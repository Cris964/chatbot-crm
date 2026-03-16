import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inbox from './pages/Inbox'
import Leads from './pages/Leads'
import Clients from './pages/Clients'
import Pipeline from './pages/Pipeline'
import Sales from './pages/Sales'
import Dispatches from './pages/Dispatches'
import Automations from './pages/Automations'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/dispatches" element={<Dispatches />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
