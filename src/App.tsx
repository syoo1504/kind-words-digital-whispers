
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmployeePortal from "./pages/EmployeePortal";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeScan from "./pages/EmployeeScan";
import EmployeeQRGenerator from "./pages/EmployeeQRGenerator";
import EmployeeReport from "./pages/EmployeeReport";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeProtectedRoute from "./components/EmployeeProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Default route redirects to employee login */}
          <Route path="/" element={<EmployeeLogin />} />
          
          {/* Employee routes */}
          <Route path="/employee-login" element={<EmployeeLogin />} />
          <Route path="/employee/scan" element={
            <EmployeeProtectedRoute>
              <EmployeeScan />
            </EmployeeProtectedRoute>
          } />
          <Route path="/employee/generator" element={
            <EmployeeProtectedRoute>
              <EmployeeQRGenerator />
            </EmployeeProtectedRoute>
          } />
          <Route path="/employee/report" element={
            <EmployeeProtectedRoute>
              <EmployeeReport />
            </EmployeeProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Legacy routes for backward compatibility */}
          <Route path="/scanner" element={<EmployeePortal />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
