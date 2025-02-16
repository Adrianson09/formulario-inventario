import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ListaTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [filters, setFilters] = useState({
        consecutivo: "",
        cliente: "",
        codigo_cliente: ""
    });

    const navigate = useNavigate();

    useEffect(() => {
        axios.get("http://localhost:3001/tickets")
            .then(response => {
                setTickets(response.data);
                setFilteredTickets(response.data);
            })
            .catch(error => console.error("Error cargando tickets", error));
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);

        const filtered = tickets.filter(ticket =>
            ticket.consecutivo.toLowerCase().includes(newFilters.consecutivo.toLowerCase()) &&
            ticket.cliente.toLowerCase().includes(newFilters.cliente.toLowerCase()) &&
            ticket.codigo_cliente.toLowerCase().includes(newFilters.codigo_cliente.toLowerCase())
        );

        setFilteredTickets(filtered);
    };

    return (
        <div className="max-w-6xl mx-auto bg-white p-6 shadow-md rounded-lg">
            <h1 className="text-xl font-bold mb-4 text-center">Listado de Tickets</h1>
            
            {/* Filtros Responsivos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                    type="text"
                    name="consecutivo"
                    placeholder="Filtrar por Consecutivo"
                    value={filters.consecutivo}
                    onChange={handleFilterChange}
                    className="border p-2 rounded w-full"
                />
                <input
                    type="text"
                    name="cliente"
                    placeholder="Filtrar por Cliente"
                    value={filters.cliente}
                    onChange={handleFilterChange}
                    className="border p-2 rounded w-full"
                />
                <input
                    type="text"
                    name="codigo_cliente"
                    placeholder="Filtrar por Código Cliente"
                    value={filters.codigo_cliente}
                    onChange={handleFilterChange}
                    className="border p-2 rounded w-full"
                />
            </div>

            {/* Tabla Responsiva */}
            <div className="overflow-x-auto">
                <table className="w-full border mt-2 text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Consecutivo</th>
                            <th className="border p-2">Cliente</th>
                            <th className="border p-2">Código Cliente</th>
                            <th className="border p-2 hidden md:table-cell">Proyecto </th>
                            <th className="border p-2 hidden md:table-cell">Ticket Venta </th>
                            <th className="border p-2 hidden md:table-cell">Solicitante </th>
                            <th className="border p-2">Fecha Reporte</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-gray-100 cursor-pointer">
                                <td className="border p-2 text-blue-500 underline" 
                                    onClick={() => navigate(`/ticket/${ticket.id}`)}>
                                    {ticket.consecutivo}
                                </td>
                                <td className="border p-2">{ticket.cliente}</td>
                                <td className="border p-2">{ticket.codigo_cliente}</td>
                                <td className="border p-2 hidden md:table-cell">{ticket.proyecto}</td>
                                <td className="border p-2 hidden md:table-cell">{ticket.ticket_venta}</td>
                                <td className="border p-2 hidden md:table-cell">{ticket.solicitante}</td>
                                <td className="border p-2">{new Date(ticket.fecha_reporte).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListaTickets;
