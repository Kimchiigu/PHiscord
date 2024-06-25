import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ToastProvider from "./pages/provider/ToastProvider";
import Settings from "./pages/settings/Settings";
import GeneralSettings from './pages/settings/GeneralSettings';
import AppearanceSettings from './pages/settings/AppearanceSettings';
import OverlaySettings from './pages/settings/OverlaySettings';
import PrivacySettings from './pages/settings/PrivacySettings';
import { AuthProvider } from "./pages/provider/AuthProvider";
import { ThemeProvider } from "./pages/provider/ThemeProvider";

function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/home" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />}>
                {/* Child routes will be rendered inside the Outlet of the Settings component */}
                <Route path="general" element={<GeneralSettings />} />
                <Route path="appearance" element={<AppearanceSettings />} />
                <Route path="overlay" element={<OverlaySettings />} />
                <Route path="privacy" element={<PrivacySettings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
