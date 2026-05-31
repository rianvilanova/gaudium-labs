/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DatabaseProvider } from "./context/DatabaseContext";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";

function AppContent() {
  const { currentUser } = useAuth();
  
  // Automatically bind to system preferences or saved localStorage for theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("gaudium-theme");
    if (savedTheme) {
      if (savedTheme === "dark") {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Initial evaluation
    handleThemeChange(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  if (!currentUser) {
    return <Login />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </AuthProvider>
  );
}

