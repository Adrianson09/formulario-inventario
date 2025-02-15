import { Outlet, Link } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white p-6">
        <h2 className="text-xl font-bold mb-6">Gestión de Tickets</h2>
        <nav className="space-y-4">
          <Link to="/" className="block p-2 bg-blue-700 rounded">📋 Listado de Tickets</Link>
          <Link to="/nuevo-ticket" className="block p-2 bg-green-600 rounded">➕ Nuevo Ticket</Link>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
