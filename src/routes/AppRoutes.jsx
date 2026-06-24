import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Transfer from "../pages/Transfer";
import Transactions from "../pages/Transactions";
import Deposit from "../pages/Deposit";
import Withdraw from "../pages/Withdraw";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminRoute from "./AdminRoute";

import MainLayout from "../layout/MainLayout";
import { PrivateRoute } from "./PrivateRoute";

import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Profile from "../pages/Profile";
import LandingPage from "../pages/landing/Landingpage";

// KYC
import KycUpload from "../pages/KycUpload";
import AdminKycPanel from "../pages/admin/AdminKycPanel";
import AdminTransactions from "../pages/admin/AdminTransactions";
import ScheduledTransfers from "../pages/ScheduledTransfers";
import LimitsOverview from "../pages/LimitsOverview";

// FD
import CreateFD from "../pages/fd/CreateFD";
import MyFDs from "../pages/fd/MyFDs";
import FDDetails from "../pages/fd/FDDetails";

export default function AppRoutes() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return (
    <BrowserRouter>
      <Routes>

        {/* ============================================
            LANDING PAGE - Default for non-authenticated users
           ============================================ */}
        <Route 
          path="/" 
          element={
            token ? (
              <Navigate to={role === "ADMIN" ? "/admin" : "/dashboard"} replace />
            ) : (
              <LandingPage />
            )
          } 
        />

        {/* ============================================
            AUTH ROUTES - Only accessible when NOT logged in
           ============================================ */}
        <Route 
          path="/login" 
          element={
            token ? (
              <Navigate to={role === "ADMIN" ? "/admin" : "/dashboard"} replace />
            ) : (
              <Login />
            )
          } 
        />

        <Route 
          path="/register" 
          element={
            token ? (
              <Navigate to={role === "ADMIN" ? "/admin" : "/dashboard"} replace />
            ) : (
              <Register />
            )
          } 
        />

        <Route 
          path="/forgot-password" 
          element={
            token ? (
              <Navigate to={role === "ADMIN" ? "/admin" : "/dashboard"} replace />
            ) : (
              <ForgotPassword />
            )
          } 
        />

        <Route 
          path="/reset-password" 
          element={
            token ? (
              <Navigate to={role === "ADMIN" ? "/admin" : "/dashboard"} replace />
            ) : (
              <ResetPassword />
            )
          } 
        />

        {/* ============================================
            USER DASHBOARD & PROFILE
           ============================================ */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              {role === "ADMIN" ? (
                <Navigate to="/admin" replace />
              ) : (
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              )}
            </PrivateRoute>
          }
        />

        <Route
  path="/limits"
  element={
    <PrivateRoute>
      <MainLayout>
        <LimitsOverview />
      </MainLayout>
    </PrivateRoute>
  }
/>

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* ============================================
            BANKING OPERATIONS - Transfer, Transactions, etc
           ============================================ */}
        <Route
          path="/transfer"
          element={
            <PrivateRoute>
              <MainLayout>
                <Transfer />
              </MainLayout>
            </PrivateRoute>
          }
        />

        

        <Route
          path="/scheduled-transfers"
          element={
            <PrivateRoute>
              <MainLayout>
                <ScheduledTransfers />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <PrivateRoute>
              <MainLayout>
                <Transactions />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* ============================================
    FIXED DEPOSITS
   ============================================ */}

<Route
  path="/fd/create"
  element={
    <PrivateRoute>
      <MainLayout>
        <CreateFD />
      </MainLayout>
    </PrivateRoute>
  }
/>

<Route
  path="/fd/my-fds"
  element={
    <PrivateRoute>
      <MainLayout>
        <MyFDs />
      </MainLayout>
    </PrivateRoute>
  }
/>

<Route
  path="/fd/:id"
  element={
    <PrivateRoute>
      <MainLayout>
        <FDDetails />
      </MainLayout>
    </PrivateRoute>
  }
/>

        <Route
          path="/deposit"
          element={
            <PrivateRoute>
              <MainLayout>
                <Deposit />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/withdraw"
          element={
            <PrivateRoute>
              <MainLayout>
                <Withdraw />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* ============================================
            USER KYC
           ============================================ */}
        <Route
          path="/kyc"
          element={
            <PrivateRoute>
              <MainLayout>
                <KycUpload />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* ============================================
            ADMIN ROUTES - Only accessible by ADMIN role
           ============================================ */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminRoute>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </AdminRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/kyc"
          element={
            <PrivateRoute>
              <AdminRoute>
                <MainLayout>
                  <AdminKycPanel />
                </MainLayout>
              </AdminRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/transactions"
          element={
            <PrivateRoute>
              <AdminRoute>
                <MainLayout>
                  <AdminTransactions />
                </MainLayout>
              </AdminRoute>
            </PrivateRoute>
          }
        />

        {/* ============================================
            404 - Catch all undefined routes
           ============================================ */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}