import  { useState, useEffect,useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";

const FormularioInventario = () => {
    
    const navigate = useNavigate();  // Hook de navegación
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado para animación
    const [firmaRecibido, setFirmaRecibido] = useState(null);
    const [consecutivo, setConsecutivo] = useState("A-0001");
    const sigCanvas = useRef(null);
    const [formData, setFormData] = useState({
        cliente: "",
        codigo_cliente: "",
        proyecto: "",
        fecha_reporte: "",
        solicitante: "",
        oc_cliente: "",
        direccion: "",
        ticket_venta: "",
        labores_realizadas: "",
        observaciones: "",
        trabajo_realizado_por: "",
        fecha_entrega: "",
        hora_inicio: "",
        hora_final: "",
        firma_trabajo: "",
        recibido_por: "",
        fecha_recibido: "",
        hora_recibido: "",
        firma_recibido: "",
        detalleEquipos: [{ cantidad: "", codigo: "", descripcion_serie: "", marca: "", modelo: "" }],
        tiposTrabajo: {
            venta: false,
            alquiler: false,
            consumo: false,
            entrega_equipo: false,
            soporte_tecnico: false,
            visita_previa: false,
            atencion_averia: false,
            entrada_equipo: false
        }
    });

    useEffect(() => {
        axios.get("http://localhost:3001/consecutivo")
            .then(response => setConsecutivo(response.data.consecutivo))
            .catch(error => console.error("Error obteniendo el consecutivo", error));
    }, []);

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
    
        if (type === "checkbox") {
            setFormData((prev) => ({
                ...prev,
                tiposTrabajo: { ...prev.tiposTrabajo, [name]: checked }
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value
            }));
        }
    };
    
    const agregarFila = () => {
        setFormData({
            ...formData,
            detalleEquipos: [...formData.detalleEquipos, { cantidad: "", codigo: "", descripcion_serie: "", marca: "", modelo: "" }]
        });
    };





// Función para limpiar la firma
const limpiarFirma = () => {
    sigCanvas.current.clear();
    setFirmaRecibido(null);
};


const guardarFirma = async () => {
    return new Promise((resolve) => {
        const firmaBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
        setFirmaRecibido(firmaBase64);
        setFormData((prev) => ({
            ...prev,
            firma_recibido: firmaBase64,
        }));
        resolve(firmaBase64); // Retorna la firma guardada
    });
};

// const handleSubmit = async (e) => { 
//     e.preventDefault();
//     setIsSubmitting(true);

//     // Esperar a que la firma se guarde antes de enviar el formulario
//     const firmaBase64 = await guardarFirma(); 

//     try {
//         await axios.post("http://localhost:3001/tickets", { 
//             ...formData, 
//             firma_recibido: firmaBase64, // Asegurar que se envíe la firma guardada
//             consecutivo
//         });

//         setTimeout(() => {
//             navigate("/"); // Redirigir a la lista de tickets
//         }, 500);
//     } catch (error) {
//         console.error("Error registrando el ticket", error);
//         alert("Error al registrar el ticket");
//         setIsSubmitting(false);
//     }
// };

// const handleSubmit = async (e) => { 
//     e.preventDefault();
//     setIsSubmitting(true); // Activar animación antes de enviar

//     await guardarFirma(); // Asegurar que la firma se guarde antes de continuar

//     const detalleEquiposValidos = formData.detalleEquipos.filter(equipo => 
//         equipo.cantidad.trim() !== "" ||
//         equipo.codigo.trim() !== "" ||
//         equipo.descripcion_serie.trim() !== "" ||
//         equipo.marca.trim() !== "" ||
//         equipo.modelo.trim() !== ""
//     );

//     const tiposTrabajoPlano = Object.keys(formData.tiposTrabajo).reduce((acc, key) => {
//         acc[key] = formData.tiposTrabajo[key] ? 1 : 0;
//         return acc;
//     }, {});

//     try {
//         await axios.post("http://localhost:3001/tickets", { 
//             ...formData, 
//             consecutivo, 
//             ...tiposTrabajoPlano,
//             detalle_equipos: detalleEquiposValidos
//         });

//         // Agregar un pequeño delay antes de redirigir
//         setTimeout(() => {
//             navigate("/"); // Redirigir a la lista de tickets
//         }, 500); // 500ms para animación
//     } catch (error) {
//         console.error("Error registrando el ticket", error);
//         alert("Error al registrar el ticket");
//         setIsSubmitting(false); // Revertir animación en caso de error
//     }
// };

const handleSubmit = async (e) => { 
    e.preventDefault();
    setIsSubmitting(true);

    // Esperar a que la firma se guarde antes de enviar el formulario
    const firmaBase64 = await guardarFirma(); 

    // Filtrar detalles de equipos que no estén vacíos
    const detalleEquiposValidos = formData.detalleEquipos.filter(equipo => 
        equipo.cantidad.trim() !== "" ||
        equipo.codigo.trim() !== "" ||
        equipo.descripcion_serie.trim() !== "" ||
        equipo.marca.trim() !== "" ||
        equipo.modelo.trim() !== ""
    );

    // Convertir tipos de trabajo de booleano a 1/0 (para el backend)
    const tiposTrabajoPlano = Object.keys(formData.tiposTrabajo).reduce((acc, key) => {
        acc[key] = formData.tiposTrabajo[key] ? 1 : 0;
        return acc;
    }, {});

    try {
        await axios.post("http://localhost:3001/tickets", { 
            ...formData, 
            firma_recibido: firmaBase64, // ✅ Firma guardada correctamente
            consecutivo,
            ...tiposTrabajoPlano, // ✅ Enviar tipos de trabajo convertidos a 1/0
            detalle_equipos: detalleEquiposValidos // ✅ Enviar solo equipos con datos
        });

        // Agregar un pequeño delay antes de redirigir
        setTimeout(() => {
            navigate("/"); // Redirigir a la lista de tickets
        }, 500); // 500ms para animación
    } catch (error) {
        console.error("Error registrando el ticket", error);
        alert("Error al registrar el ticket");
        setIsSubmitting(false); // Revertir animación en caso de error
    }
};


   
   

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-6 shadow-md rounded-lg">
        <div className="text-center mb-4">
            <h1 className="text-xl font-bold">Blue Sat - Servicios Administrados de Telecomunicaciones, S.A.</h1>
            <h2 className="text-lg font-semibold">TIQUETE DE TRABAJO</h2>
            <h3 className="text-blue-600 font-semibold">Inventario Físico</h3>
            <p className="text-sm text-gray-600">Reporte de Equipos - Inventario - Entrada - Tránsito</p>
        </div>

        <div className="mb-4 text-right">
            <label className="font-semibold">Consecutivo:</label>
            <span className="font-bold text-red-500">{consecutivo}</span>
        </div>

      

<div className="grid grid-cols-2 gap-4">
    {[
        { label: "Cliente", name: "cliente", type: "text" },
        { label: "Código Cliente", name: "codigo_cliente", type: "text" },
        { label: "Proyecto", name: "proyecto", type: "text" },
        { label: "Fecha Reporte", name: "fecha_reporte", type: "date" },
        { label: "Solicitante", name: "solicitante", type: "text" },
        { label: "OC Cliente", name: "oc_cliente", type: "text" },
        { label: "Dirección", name: "direccion", type: "text" },
        { label: "Ticket Venta", name: "ticket_venta", type: "text" },
    ].map(({ label, name, type }) => (
        <div key={name}>
            <label className="block font-semibold">{label}:</label>
            <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
            />
        </div>
    ))}
</div>

<div className="mt-4">
    <label className="block font-semibold">LABORES REALIZADAS:</label>
    <textarea
        name="labores_realizadas"
        value={formData.labores_realizadas}
        onChange={handleChange}
        className="w-full border rounded p-2 h-20"
    />
</div>

<div className="mt-4">
    <label className="block font-semibold">OBSERVACIONES:</label>
    <textarea
        name="observaciones"
        value={formData.observaciones}
        onChange={handleChange}
        className="w-full border rounded p-2 h-16"
    />
</div>



        <div className="mt-4">
            <label className="block font-semibold">Tipos de Trabajo:</label>
            <div className="grid grid-cols-3 gap-4">
                {Object.keys(formData.tiposTrabajo).map((key) => (
                    <label key={key}>
                        <input
                            type="checkbox"
                            name={key}
                            checked={formData.tiposTrabajo[key]}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        {key.replace("_", " ").toUpperCase()}
                    </label>
                ))}
            </div>
        </div>

        <div className="mt-4">
            <h3 className="text-lg font-semibold">Detalle de Equipos</h3>
            <table className="w-full border mt-2">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2">Cantidad</th>
                        <th className="border p-2">Código</th>
                        <th className="border p-2">Descripción y Serie</th>
                        <th className="border p-2">Marca</th>
                        <th className="border p-2">Modelo</th>
                    </tr>
                </thead>
                <tbody>
    {formData.detalleEquipos.map((detalle, index) => (
        <tr key={index}>
            {Object.keys(detalle).map((field) => (
                <td key={field} className="border p-2">
                    <input
                        type="text"
                        name={field}
                        value={detalle[field]}
                        onChange={(e) => {
                            const newDetalleEquipos = [...formData.detalleEquipos];
                            newDetalleEquipos[index][field] = e.target.value;
                            setFormData({ ...formData, detalleEquipos: newDetalleEquipos });
                        }}
                        className="w-full border rounded p-1"
                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <button
                type="button"
                onClick={agregarFila}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
                Agregar Línea
            </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border p-4 rounded">
                <h3 className="font-semibold">Trabajo Realizado Por</h3>
                <label>Nombre:</label>
                <input
                    type="text"
                    name="trabajo_realizado_por"
                    value={formData.trabajo_realizado_por}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                    required
                />
                <label>Fecha entrega:</label>
                <input
                    type="date"
                    name="fecha_entrega"
                    value={formData.fecha_entrega}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]} // Restringe fechas anteriores a hoy
                    className="w-full border rounded p-2"
                />
                <label>Hora inicio:</label>
                <input
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                />
                <label>Hora final:</label>
                <input
                    type="time"
                    name="hora_final"
                    value={formData.hora_final}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                />
             
            </div>
            <div className="border p-4 rounded">
                <h3 className="font-semibold">Recibido Conforme</h3>
                <label>Nombre:</label>
                <input
                    type="text"
                    name="recibido_por"
                    value={formData.recibido_por}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                    required
                />
                <label>Fecha:</label>
                <input
                    type="date"
                    name="fecha_recibido"
                    value={formData.fecha_recibido}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]} // Restringe fechas anteriores a hoy
                    className="w-full border rounded p-2"
                />
                <label>Hora:</label>
                <input
                    type="time"
                    name="hora_recibido"
                    value={formData.hora_recibido}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                />
                <label>Firma:</label>
            

<div className="mt-4 border p-4 rounded">
    <h3 className="font-semibold">Firma Recibido:</h3>
    <SignatureCanvas
        required
        ref={sigCanvas}
        penColor="black"
        canvasProps={{
            className: "border w-full h-32 bg-gray-100 rounded"
        }}
    />
    <div className="flex space-x-2 mt-2">
        <button type="button" onClick={guardarFirma} className="px-4 py-2 bg-green-500 text-white rounded">
            Guardar Firma
        </button>
        <button type="button" onClick={limpiarFirma} className="px-4 py-2 bg-red-500 text-white rounded">
            Limpiar
        </button>
    </div>
</div>
            </div>
        </div>

        <button type="submit" className="mt-4 px-4 py-2 bg-green-500 text-white rounded">
            Registrar Ticket
        </button>
    </form>

        
    );
};

export default FormularioInventario;
