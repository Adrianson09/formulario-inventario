import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const formatDate = (isoDate) => (isoDate ? new Date(isoDate).toISOString().split("T")[0] : "");
const formatTime = (time) => (time ? time.substring(0, 5) : "");

const DetalleTicket = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    // const token = localStorage.getItem("token"); // Obtiene el token almacenado

    useEffect(() => {
        const token = localStorage.getItem("token"); // Obtener el token de localStorage
    
        axios.get(`http://localhost:3001/tickets/${id}`, {
            headers: {
                Authorization: `Bearer ${token}` // Enviar el token en la petición
            }
        })
        .then(response => setTicket(response.data))
        .catch(error => {
            console.error("Error cargando el ticket", error);
            if (error.response && error.response.status === 401) {
                navigate("/"); // Redirigir al login si no está autenticado
            }
        });
    }, [id, navigate]);

    if (!ticket) return <p className="text-center">Cargando...</p>;

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 shadow-md rounded-lg">
            {/* Encabezado */}
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold">Blue Sat - Servicios Administrados de Telecomunicaciones, S.A.</h1>
                <h2 className="text-lg font-semibold">TIQUETE DE TRABAJO</h2>
                <h3 className="text-blue-600 font-semibold">Inventario Físico</h3>
                <p className="text-sm text-gray-600">Reporte de Equipos - Inventario - Entrada - Tránsito</p>
            </div>

            {/* Consecutivo */}
            <div className="mb-4 text-right">
                <label className="font-semibold">Consecutivo:</label>
                <span className="font-bold text-red-500">{ticket.consecutivo}</span>
            </div>

            {/* Datos Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { label: "Cliente", name: "cliente" },
                    { label: "Código Cliente", name: "codigo_cliente" },
                    { label: "Proyecto", name: "proyecto" },
                    { label: "Fecha Reporte", name: "fecha_reporte", type: "date" },
                    { label: "Solicitante", name: "solicitante" },
                    { label: "OC Cliente", name: "oc_cliente" },
                    { label: "Dirección", name: "direccion" },
                    { label: "Ticket Venta", name: "ticket_venta" },
                ].map(({ label, name, type }) => (
                    <div key={name}>
                        <label className="block font-semibold">{label}:</label>
                        <input
                            type={type || "text"}
                            value={type === "date" ? formatDate(ticket[name]) : (ticket[name] || "")}
                            disabled
                            className="w-full border rounded p-2 bg-gray-100"
                        />
                    </div>
                ))}
            </div>

            {/* Labores y Observaciones */}
            <div className="mt-4">
                <label className="block font-semibold">LABORES REALIZADAS:</label>
                <textarea
                    value={ticket.labores_realizadas || ""}
                    disabled
                    className="w-full border rounded p-2 h-20 bg-gray-100"
                />
            </div>

            <div className="mt-4">
                <label className="block font-semibold">OBSERVACIONES:</label>
                <textarea
                    value={ticket.observaciones || ""}
                    disabled
                    className="w-full border rounded p-2 h-16 bg-gray-100"
                />
            </div>

            {/* Tipos de Trabajo */}
            <div className="mt-4">
                <label className="block font-semibold">Tipos de Trabajo:</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        "venta", "alquiler", "consumo", "entrega_equipo",
                        "soporte_tecnico", "visita_previa", "atencion_averia", "entrada_equipo"
                    ].map((key) => (
                        <label key={key} className="flex items-center">
                            <input type="checkbox" checked={ticket[key]} disabled className="mr-2" />
                            {key.replace("_", " ").toUpperCase()}
                        </label>
                    ))}
                </div>
            </div>

            {/* Detalle de Equipos */}
            <div className="mt-4 overflow-x-auto">
                <h3 className="text-lg font-semibold">Detalle de Equipos</h3>
                <table className="w-full border mt-2">
                    <thead>
                        <tr className="bg-gray-200 text-sm">
                            <th className="border p-2">Cantidad</th>
                            <th className="border p-2">Código</th>
                            <th className="border p-2">Descripción y Serie</th>
                            <th className="border p-2">Marca</th>
                            <th className="border p-2">Modelo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ticket.detalle_equipos.map((detalle, index) => (
                            <tr key={index}>
                                {Object.values(detalle).slice(1).map((value, i) => (
                                    <td key={i} className="border p-2 text-sm">{value}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Información de Trabajo y Recibido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="border p-4 rounded">
                    <h3 className="font-semibold">Trabajo Realizado Por</h3>
                    {[
                        { label: "Nombre", name: "trabajo_realizado_por" },
                        { label: "Fecha Entrega", name: "fecha_entrega", type: "date" },
                        { label: "Hora Inicio", name: "hora_inicio", type: "time" },
                        { label: "Hora Final", name: "hora_final", type: "time" }
                    ].map(({ label, name, type }) => (
                        <div key={name}>
                            <label>{label}:</label>
                            <input
                                type={type || "text"}
                                value={type === "date" ? formatDate(ticket[name]) : type === "time" ? formatTime(ticket[name]) : (ticket[name] || "")}
                                disabled
                                className="w-full border rounded p-2 bg-gray-100"
                            />
                        </div>
                    ))}
                </div>

                <div className="border p-4 rounded">
                    <h3 className="font-semibold">Recibido Conforme</h3>
                    {[
                        { label: "Nombre", name: "recibido_por" },
                        { label: "Fecha", name: "fecha_recibido", type: "date" },
                        { label: "Hora", name: "hora_recibido", type: "time" }
                    ].map(({ label, name, type }) => (
                        <div key={name}>
                            <label>{label}:</label>
                            <input
                                type={type || "text"}
                                value={type === "date" ? formatDate(ticket[name]) : type === "time" ? formatTime(ticket[name]) : (ticket[name] || "")}
                                disabled
                                className="w-full border rounded p-2 bg-gray-100"
                            />
                        </div>
                    ))}

                    {/* Firma */}
                    <div className="mt-4">
                        <h3 className="font-semibold">Firma Recibido:</h3>
                        {ticket.firma_recibido ? (
                            <img src={`http://localhost:3001/${ticket.firma_recibido}`} alt="Firma" className="border w-full h-32 bg-gray-100 rounded" />
                        ) : (
                            <p className="text-gray-500">No disponible</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Botón de Volver */}
            <button onClick={() => navigate("/dashboard")} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                Volver
            </button>
        </div>
    );
};

export default DetalleTicket;
