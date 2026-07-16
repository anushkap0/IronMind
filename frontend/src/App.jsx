import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import BackgroundFX from "./components/BackgroundFX";
import CustomCursor from "./components/CustomCursor";
import NotificationToasts from "./components/NotificationToasts";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BMICalculator from "./pages/BMICalculator";
import Routines from "./pages/Routines";
import WorkoutTimer from "./pages/WorkoutTimer";
import WorkoutVision from "./pages/WorkoutVision";
import Chatbot from "./pages/Chatbot";
import OAuthCallback from "./pages/OAuthCallback";

function AppLayout({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen font-body text-bone">
      <BackgroundFX />
      <Navbar />
      <NotificationToasts />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <CustomCursor />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        <Route
          path="/dashboard"
          element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>}
        />
        <Route
          path="/bmi"
          element={<ProtectedRoute><AppLayout><BMICalculator /></AppLayout></ProtectedRoute>}
        />
        <Route
          path="/routines"
          element={<ProtectedRoute><AppLayout><Routines /></AppLayout></ProtectedRoute>}
        />
        <Route
          path="/timer"
          element={<ProtectedRoute><AppLayout><WorkoutTimer /></AppLayout></ProtectedRoute>}
        />
        <Route
          path="/vision"
          element={<ProtectedRoute><AppLayout><WorkoutVision /></AppLayout></ProtectedRoute>}
        />
        <Route
          path="/coach"
          element={<ProtectedRoute><AppLayout><Chatbot /></AppLayout></ProtectedRoute>}
        />

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
}
