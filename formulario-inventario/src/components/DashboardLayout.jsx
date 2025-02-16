import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, List, FilePlus, LogOut } from "lucide-react"; // Iconos para el menú

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Botón de menú en móviles */}
            <button 
                className="lg:hidden fixed top-4 left-4 z-50 bg-blue-700 text-white p-2 rounded focus:outline-none"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside 
                className={`fixed inset-y-0 left-0 w-64 bg-blue-900 text-white p-6 transform transition-transform duration-300 ease-in-out 
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative lg:w-64`}
            >
                <h2 className="text-xl font-bold mb-6">Gestión de Tickets</h2>
                <nav className="space-y-4">
                    <Link to="/dashboard" className="flex items-center p-2 bg-blue-700 rounded">
                        <List className="w-5 h-5 mr-2" /> Listado de Tickets
                    </Link>
                    <Link to="/dashboard/nuevo-ticket" className="flex items-center p-2 bg-green-600 rounded">
                        <FilePlus className="w-5 h-5 mr-2" /> Nuevo Ticket
                    </Link>
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center w-full p-2 bg-red-600 rounded mt-4"
                    >
                        <LogOut className="w-5 h-5 mr-2" /> Cerrar Sesión
                    </button>
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
