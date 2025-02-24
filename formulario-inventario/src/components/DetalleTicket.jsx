import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";


const formatDate = (isoDate) => (isoDate ? new Date(isoDate).toISOString().split("T")[0] : "");
const formatTime = (time) => (time ? time.substring(0, 5) : "");

const DetalleTicket = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const formRef = useRef(null);
    // const token = localStorage.getItem("token"); // Obtiene el token almacenado

    useEffect(() => {
        const token = localStorage.getItem("token"); // Obtener el token de localStorage
    
        axios.get(`http://31.220.104.197:3001/tickets/${id}`, {
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


    
   
    const generatePDF = async () => {
        if (!document.getElementById("section1") || !document.getElementById("section2")) return;
      
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
      
        // Sección 1
        const canvas1 = await html2canvas(document.getElementById("section1"), {
          scale: 2,
          backgroundColor: "#ffffff",
          width: 794,
          windowWidth: 794,
          useCORS: true,
        });
        const imgData1 = canvas1.toDataURL("image/png");
        const imgProps1 = pdf.getImageProperties(imgData1);
        const imgWidth1 = pdfWidth;
        const imgHeight1 = (imgProps1.height * imgWidth1) / imgProps1.width;
        pdf.addImage(imgData1, "PNG", 0, 0, imgWidth1, imgHeight1);
      
        // Nueva página para la sección 2
        pdf.addPage();
        const canvas2 = await html2canvas(document.getElementById("section2"), {
          scale: 2,
          backgroundColor: "#ffffff",
          width: 794,
          windowWidth: 794,
          useCORS: true,
        });
        const imgData2 = canvas2.toDataURL("image/png");
        const imgProps2 = pdf.getImageProperties(imgData2);
        const imgWidth2 = pdfWidth;
        const imgHeight2 = (imgProps2.height * imgWidth2) / imgProps2.width;
        pdf.addImage(imgData2, "PNG", 0, 0, imgWidth2, imgHeight2);
      
        pdf.save(`Ticket_${ticket.consecutivo}.pdf`);
      };
       

    if (!ticket) return <p className="text-center">Cargando...</p>;

    return (
        <div className="max-w-4xl mx-auto bg-[#fff] p-6 shadow-md rounded-lg">
             <div ref={formRef} className="p-4">
             <div id="section1" className="p-4">
            {/* Encabezado */}
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold">Blue Sat - Servicios Administrados de Telecomunicaciones, S.A.</h1>
                <h2 className="text-lg font-semibold">TIQUETE DE TRABAJO</h2>
                <h3 className="text-[#155dfc] font-semibold">Inventario Físico</h3>
                <p className="text-sm text-[#4a5565]">Reporte de Equipos - Inventario - Entrada - Tránsito</p>
            </div>

            {/* Consecutivo */}
            <div className="mb-4 text-right">
                <label className="font-semibold">Consecutivo:</label>
                <span className="font-bold text-[#fb2c36]">{ticket.consecutivo}</span>
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
                        <label className="block font-semibold my-2">{label}:</label>
                        <input
                            type={type || "text"}
                            value={type === "date" ? formatDate(ticket[name]) : (ticket[name] || "")}
                            disabled
                            className="w-full border rounded p-2  bg-[#f3f4f6]"
                        />
                    </div>
                ))}
            </div>

            {/* Labores y Observaciones */}
            <div className="mt-4">
                <label className="block font-semibold my-2">LABORES REALIZADAS:</label>
                <textarea
                    value={ticket.labores_realizadas || ""}
                    disabled
                    className="w-full border rounded p-2 h-20 bg-[#f3f4f6]"
                />
            </div>

            <div className="mt-4">
                <label className="block font-semibold my-2">OBSERVACIONES:</label>
                <textarea
                    value={ticket.observaciones || ""}
                    disabled
                    className="w-full border rounded p-2 h-16 bg-[#f3f4f6]"
                />
            </div>

            {/* Tipos de Trabajo */}
            <div className="mt-4">
                <label className="block font-semibold my-2">Tipos de Trabajo:</label>
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
            </div>       
            
            <div id="section2" className="p-4">      
            {/* Detalle de Equipos */}
            <div className="mt-4 overflow-x-auto">
                <h3 className="text-lg font-semibold">Detalle de Equipos</h3>
                <table className="w-full border mt-2">
                    <thead>
                        <tr className="bg-[#e5e7eb] text-sm">
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
                            <label className="my-2">{label}:</label>
                            <input
                                type={type || "text"}
                                value={type === "date" ? formatDate(ticket[name]) : type === "time" ? formatTime(ticket[name]) : (ticket[name] || "")}
                                disabled
                                className="w-full my-2 border rounded p-2 bg-[#f3f4f6]"
                            />
                        </div>
                    ))}
                </div>

                <div className="border p-4 rounded">
                    <h3 className="font-semibold">Recibido Conforme</h3>
                    {[
                        { label: "Nombre", name: "recibido_por" },
                        { label: "Correo Del Cliente", name: "correo_cliente", type: "email" },
                        { label: "Fecha", name: "fecha_recibido", type: "date" },
                        { label: "Hora", name: "hora_recibido", type: "time" }
                    ].map(({ label, name, type }) => (
                        <div key={name}>
                            <label className="my-2">{label}:</label>
                            <input
                                type={type || "text"}
                                value={type === "date" ? formatDate(ticket[name]) : type === "time" ? formatTime(ticket[name]) : (ticket[name] || "")}
                                disabled
                                className="w-full my-2 border rounded p-2 bg-[#f3f4f6]"
                            />
                        </div>
                    ))}

                    {/* Firma */}
                    <div className="mt-4">
                        <h3 className="font-semibold my-2">Firma Recibido:</h3>
                        {ticket.firma_recibido ? (
                            <img src={`http://31.220.104.197:3001/${ticket.firma_recibido}`} alt="Firma" className="border w-full h-32 bg-[#f3f4f6] rounded" />
                        ) : (
                            <p className="text-[#6a7282]">No disponible</p>
                        )}
                    </div>
                </div>
                </div>  
            </div>

            </div>

        <div className="flex justify-between mt-4">

           {/* Botón para generar PDF */}
           <button
                onClick={generatePDF}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-[#fff] rounded "
                >
                Generar PDF
            </button>
            
            {/* Botón de Volver */}
            <button onClick={() => navigate("/dashboard")} className="mt-4 px-4 py-2 bg-blue-500 text-[#fff] rounded">
                Volver
            </button>
                </div>
        </div>
    );
};

export default DetalleTicket;
