import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import DetalleTicket from "./components/DetalleTicket";
import ListaTickets from "./components/ListaTickets";
import FormularioInventario from "./components/FormularioInventario";
import DashboardLayout from "./components/DashboardLayout"; // Nuevo Layout
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import "./index.css";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
  return (
    <Router>
   <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
    <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
    <Route path="/register/" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
            <Route index element={<ListaTickets />} />
            <Route path="nuevo-ticket" element={<FormularioInventario />} />
            <Route path="ticket/:id" element={<DetalleTicket />} />
        </Route>
    </Route>
</Routes>
</Router>
  );
}

export default App;
