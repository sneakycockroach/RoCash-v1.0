/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider.tsx';
import { RefreshProvider } from './hooks/useData.tsx';
import { SplashScreen } from './pages/SplashScreen.tsx';
import { WelcomeScreen } from './pages/WelcomeScreen.tsx';
import { SignUpScreen } from './pages/SignUpScreen.tsx';
import { SignInScreen } from './pages/SignInScreen.tsx';
import { IntroScreen } from './pages/IntroScreen.tsx';
import { OnboardingStep1 } from './pages/OnboardingStep1.tsx';
import { OnboardingStep2 } from './pages/OnboardingStep2.tsx';
import { OnboardingStep3 } from './pages/OnboardingStep3.tsx';
import { AllSetScreen } from './pages/AllSetScreen.tsx';
import { WelcomeBackScreen } from './pages/WelcomeBackScreen.tsx';
import { HomeScreen } from './pages/HomeScreen.tsx';

import { HistoryScreen } from './pages/HistoryScreen.tsx';
import { MonthDetailScreen } from './pages/MonthDetailScreen.tsx';
import { ReportsScreen } from './pages/ReportsScreen.tsx';
import { RewardsScreen } from './pages/RewardsScreen.tsx';
import { ProfileScreen } from './pages/ProfileScreen.tsx';
import { DailyGoalScreen } from './pages/DailyGoalScreen.tsx';
import { CategoriesManagerScreen } from './pages/CategoriesManagerScreen.tsx';

import { Debug } from './pages/Debug.tsx';
import { AppShell } from './components/AppShell.tsx';


/**
 * Route guard: unauthenticated users are redirected to /welcome
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto bg-[#FF8A1F] flex items-center justify-center select-none">
        <h1 className="text-[56px] font-extrabold tracking-tight text-[#2B2622] leading-none">
          RoCash
        </h1>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const [bootReady, setBootReady] = useState(false);

  return (
    <AuthProvider>
      <RefreshProvider>
        <HashRouter>
          {!bootReady ? (
            <SplashScreen onFinish={() => setBootReady(true)} />
          ) : (
            <Routes>
              {/* Public Entry Screens */}
              <Route path="/welcome" element={<WelcomeScreen />} />
              <Route path="/signup" element={<SignUpScreen />} />
              <Route path="/signin" element={<SignInScreen />} />

              {/* Onboarding Flow (Guarded) */}
              <Route
                path="/onboarding/intro"
                element={
                  <ProtectedRoute>
                    <IntroScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding/step-1"
                element={
                  <ProtectedRoute>
                    <OnboardingStep1 />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding/step-2"
                element={
                  <ProtectedRoute>
                    <OnboardingStep2 />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding/step-3"
                element={
                  <ProtectedRoute>
                    <OnboardingStep3 />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding/all-set"
                element={
                  <ProtectedRoute>
                    <AllSetScreen />
                  </ProtectedRoute>
                }
              />

              {/* Welcome Back (Guarded) */}
              <Route
                path="/welcome-back"
                element={
                  <ProtectedRoute>
                    <WelcomeBackScreen />
                  </ProtectedRoute>
                }
              />

              {/* Main App Screens wrapped in AppShell */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <HomeScreen />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <HistoryScreen />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history/:yearMonth"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <MonthDetailScreen />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ReportsScreen />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rewards"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <RewardsScreen />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ProfileScreen />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/goal"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <DailyGoalScreen />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/categories"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <CategoriesManagerScreen />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debug"
                element={
                  <ProtectedRoute>
                    <Debug />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirects to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </HashRouter>
      </RefreshProvider>
    </AuthProvider>
  );
}
