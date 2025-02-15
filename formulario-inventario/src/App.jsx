import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DetalleTicket from "./components/DetalleTicket";
import ListaTickets from "./components/ListaTickets";
import FormularioInventario from "./components/FormularioInventario";
import DashboardLayout from "./components/DashboardLayout"; // Nuevo Layout
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<ListaTickets />} />
          <Route path="nuevo-ticket" element={<FormularioInventario />} />
          <Route path="ticket/:id" element={<DetalleTicket />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
