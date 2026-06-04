import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Layout } from './components/ui/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { BuildingsPage } from './pages/BuildingsPage'
import { BuildingFormPage } from './pages/BuildingFormPage'
import { BuildingDetailPage } from './pages/BuildingDetailPage'
import { AssetsPage } from './pages/AssetsPage'
import { AssetFormPage } from './pages/AssetFormPage'
import { AssetDetailPage } from './pages/AssetDetailPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/buildings" element={<ProtectedRoute><BuildingsPage /></ProtectedRoute>} />
      <Route path="/buildings/new" element={<ProtectedRoute><BuildingFormPage /></ProtectedRoute>} />
      <Route path="/buildings/:id" element={<ProtectedRoute><BuildingDetailPage /></ProtectedRoute>} />
      <Route path="/buildings/:id/edit" element={<ProtectedRoute><BuildingFormPage /></ProtectedRoute>} />
      <Route path="/assets" element={<ProtectedRoute><AssetsPage /></ProtectedRoute>} />
      <Route path="/assets/new" element={<ProtectedRoute><AssetFormPage /></ProtectedRoute>} />
      <Route path="/assets/:id" element={<ProtectedRoute><AssetDetailPage /></ProtectedRoute>} />
      <Route path="/assets/:id/edit" element={<ProtectedRoute><AssetFormPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
