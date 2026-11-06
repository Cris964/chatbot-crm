import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { TenantProvider, useTenant } from './lib/useTenant'
import Layout from './components/Layout'
import Login from './pages/Login'

// Cada módulo se carga solo cuando se visita: el login no arrastra el CRM entero.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Inbox = lazy(() => import('./pages/Inbox'))
const Leads = lazy(() => import('./pages/Leads'))
const Pipeline = lazy(() => import('./pages/Pipeline'))
const Clients = lazy(() => import('./pages/Clients'))
const Sales = lazy(() => import('./pages/Sales'))
const Dispatches = lazy(() => import('./pages/Dispatches'))
const Remarketing = lazy(() => import('./pages/Remarketing'))
const Lists = lazy(() => import('./pages/Lists'))
const Automations = lazy(() => import('./pages/Automations'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const UsersPage = lazy(() => import('./pages/Users'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Marketing = lazy(() => import('./pages/Marketing'))
const Products = lazy(() => import('./pages/Products'))
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'))
const Billing = lazy(() => import('./pages/Billing'))

// Protected Route Wrapper
const ProtectedRoute = ({ children, isLoading, session }) => {
  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

// Guards por rol. Deben vivir DENTRO de TenantProvider para poder leer el rol.
const LoadingScreen = () => (
  <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    Cargando...
  </div>
)

const AdminRoute = ({ children }) => {
  const { isLoading, isAdmin, isSuperAdmin } = useTenant()
  if (isLoading) return <LoadingScreen />
  if (!isAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />
  return children
}

const SuperAdminRoute = ({ children }) => {
  const { isLoading, isSuperAdmin } = useTenant()
  if (isLoading) return <LoadingScreen />
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('App: Initializing auth state...')
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('App: Error getting session:', error)
      console.log('App: Session loaded:', session ? 'Yes' : 'No')
      setSession(session)
      setIsLoading(false)
    })

    // Listen for changes on auth state (log in, log out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('App: Auth state changed:', _event, session ? 'Yes' : 'No')
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
      <Route 
        path="/login" 
        element={
          session ? <Navigate to="/dashboard" replace /> : <Login onLogin={(session) => setSession(session)} />
        } 
      />
      
      <Route path="/" element={
        <ProtectedRoute isLoading={isLoading} session={session}>
          <TenantProvider session={session}>
            <Layout session={session} />
          </TenantProvider>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inbox" element={<Inbox />} />
        
        {/* Management Routes (Spanish & English Aliases) */}
        <Route path="leads" element={<Leads />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="clients" element={<Navigate to="/clientes" replace />} />
        
        <Route path="pipeline" element={<Pipeline />} />
        
        <Route path="ventas" element={<Sales />} />
        <Route path="sales" element={<Navigate to="/ventas" replace />} />
        
        <Route path="remarketing" element={<Remarketing />} />
        <Route path="lists" element={<Lists />} />

        <Route path="despachos" element={<Dispatches />} />
        <Route path="dispatches" element={<Navigate to="/despachos" replace />} />
        
        <Route path="productos" element={<Products />} />
        
        {/* System Routes */}
        <Route path="automatizaciones" element={<Automations />} />
        <Route path="automations" element={<Navigate to="/automatizaciones" replace />} />
        
        <Route path="reportes" element={<Reports />} />
        <Route path="reports" element={<Navigate to="/reportes" replace />} />
        
        <Route path="calendario" element={<Calendar />} />
        <Route path="marketing" element={<Marketing />} />
        
        <Route path="usuarios" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="pagos" element={<AdminRoute><Billing /></AdminRoute>} />

        <Route path="configuracion" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="settings" element={<Navigate to="/configuracion" replace />} />

        <Route path="super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

        {/* Catch-all for internal routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      
      {/* Absolute Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
