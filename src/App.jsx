import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inbox from './pages/Inbox'
import Leads from './pages/Leads'
import Pipeline from './pages/Pipeline'
import Clients from './pages/Clients'
import Sales from './pages/Sales'
import Dispatches from './pages/Dispatches'
import Automations from './pages/Automations'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'

function App() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Listen for changes on auth state (log in, log out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>
    if (!session) return <Navigate to="/login" replace />
    return children
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          session ? <Navigate to="/dashboard" replace /> : <Login onLogin={(session) => setSession(session)} />
        } 
      />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="leads" element={<Leads />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="ventas" element={<Sales />} />
        <Route path="despachos" element={<Dispatches />} />
        <Route path="automatizaciones" element={<Automations />} />
        <Route path="reportes" element={<Reports />} />
        <Route path="configuracion" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
