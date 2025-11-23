import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ProjectsPage from './pages/ProjectsPage';
import ComponentsPage from './pages/ComponentsPage';
import CreateComponentPage from './pages/CreateComponentPage';
import ComponentVersionsPage from './pages/ComponentVersionsPage';
import ComponentVariantsPage from './pages/ComponentVariantsPage';
import PagesPage from './pages/PagesPage';
import CreatePagePage from './pages/CreatePagePage';
import PageBuilderPage from './pages/PageBuilderPage';
import ProjectExportPage from './pages/ProjectExportPage';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="components" element={<ComponentsPage />} />
          <Route path="components/new" element={<CreateComponentPage />} />
          <Route path="components/:id/versions" element={<ComponentVersionsPage />} />
          <Route path="components/:id/variants" element={<ComponentVariantsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id/export" element={<ProjectExportPage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="pages/new" element={<CreatePagePage />} />
          <Route path="pages/:id/builder" element={<PageBuilderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default App;
