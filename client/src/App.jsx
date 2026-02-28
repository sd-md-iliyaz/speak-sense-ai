import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Planning from "./pages/Planning";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Practice from "./pages/Practice";
import Courses from "./pages/Courses";

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/results" element={<Results />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/courses" element={<Courses />} />

        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
        <Route path="/profile" element={<Navigate to="/settings" replace />} />
        <Route path="/feedback" element={<Navigate to="/results" replace />} />
        <Route path="/my-learning" element={<Navigate to="/courses" replace />} />

        <Route path="/features" element={<Navigate to="/" replace />} />
        <Route path="/pricing" element={<Navigate to="/" replace />} />
        <Route path="/demo" element={<Navigate to="/signup" replace />} />
        <Route path="/reviews" element={<Navigate to="/" replace />} />
        <Route path="/blog" element={<Navigate to="/" replace />} />
        <Route path="/guides" element={<Navigate to="/" replace />} />
        <Route path="/webinars" element={<Navigate to="/" replace />} />
        <Route path="/faq" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/careers" element={<Navigate to="/" replace />} />
        <Route path="/contact" element={<Navigate to="/" replace />} />
        <Route path="/press" element={<Navigate to="/" replace />} />
        <Route path="/privacy" element={<Navigate to="/" replace />} />
        <Route path="/terms" element={<Navigate to="/" replace />} />
        <Route path="/security" element={<Navigate to="/" replace />} />
        <Route path="/cookies" element={<Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;