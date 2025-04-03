import  { useState, useEffect,useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";

const FormularioInventario = () => {
    
    const navigate = useNavigate();  // Hook de navegación
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado para animación
    const [firmaRecibido, setFirmaRecibido] = useState(null);
    const [consecutivo, setConsecutivo] = useState("A-0001");
    const [errorTiposTrabajo, setErrorTiposTrabajo] = useState(false);
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
        correo_cliente: "",
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
// https://revify.tech/
    useEffect(() => {
        axios.get("https://revify.tech/api/consecutivo")
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



const handleSubmit = async (e) => { 
    e.preventDefault();
    setIsSubmitting(true);

    // Obtener el token del localStorage
    const token = localStorage.getItem("token");

    if (!token) {
        alert("No hay token, por favor inicia sesión.");
        setIsSubmitting(false);
        return;
    }

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
    
     // Validar que al menos un checkbox esté marcado
     const algunSeleccionado = Object.values(formData.tiposTrabajo).some(value => value);
    
     if (!algunSeleccionado) {
         setErrorTiposTrabajo(true);
         return; // No enviar el formulario si la validación falla
     } else {
         setErrorTiposTrabajo(false);
     }

    try {
        await axios.post(
            "https://revify.tech/api/tickets", 
            { 
                ...formData, 
                firma_recibido: firmaBase64, // ✅ Firma guardada correctamente
                consecutivo,
                ...tiposTrabajoPlano, // ✅ Enviar tipos de trabajo convertidos a 1/0
                detalle_equipos: detalleEquiposValidos // ✅ Enviar solo equipos con datos
            },
            {
                headers: { Authorization: `Bearer ${token}` }, // ✅ Agregar token de autenticación
            }
        );

        // Agregar un pequeño delay antes de redirigir
        setTimeout(() => {
            navigate("/dashboard"); // Redirigir a la lista de tickets
        }, 500);
    } catch (error) {
        console.error("Error registrando el ticket", error);
        alert("Error al registrar el ticket: " + error.response?.data?.message);
        setIsSubmitting(false); // Revertir animación en caso de error
    }
};

const handleDeleteFila = (index) => {
    // Remueve la fila en el índice indicado
    const newDetalleEquipos = formData.detalleEquipos.filter((_, i) => i !== index);
    setFormData({ ...formData, detalleEquipos: newDetalleEquipos });
  };
   
  
  const todayCostaRica = new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });


    return (
<form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-6 shadow-md rounded-lg">
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
        <span className="font-bold text-red-500">{consecutivo}</span>
    </div>

  {/* Datos Generales */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      {name === "proyecto" ? (
        <select
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        >
          <option value="">Seleccione un proyecto</option>
          <option value="Avenida Escazu">Avenida Escazu</option>
          <option value="Avenida Medica">Avenida Medica</option>
          <option value="AE Torre 402">AE Torre 402</option>
          <option value="ALESTE">ALESTE</option>
          <option value="San Antonio Business Park">San Antonio Business Park</option>
          <option value="Bahía San Felipe">Bahía San Felipe</option>
          <option value="Real Cariari">Real Cariari</option>
          <option value="DAS AE RENLAN">DAS AE RENLAN</option>
          <option value="El Cedral">El Cedral</option>
          <option value="ECOMUR">ECOMUR</option>
          <option value="Escazu Village">Escazu Village</option>
          <option value="Green Valley">Green Valley</option>
          <option value="Plaza Itskazu">Plaza Itskazu</option>
          <option value="Lincoln Plaza">Lincoln Plaza</option>
          <option value="Mango Plaza">Mango Plaza</option>
          <option value="Cliente Externo">Cliente Externo</option>
          <option value="Plaza Bratsi">Plaza Bratsi</option>
          <option value="Marina Pez Vela">Marina Pez Vela</option>
          <option value="Terminal 7-10">Terminal 7-10</option>
          <option value="Terrazas Lindora">Terrazas Lindora</option>
          <option value="Torre Universal">Torre Universal</option>
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className="w-full border rounded p-2"
          {...(name !== "oc_cliente" ? { required: true } : {})}
        />
      )}
    </div>
  ))}
</div>


    {/* Textareas */}
    <div className="mt-4">
        <label className="block font-semibold">LABORES REALIZADAS Y PERSONAL TÉCNICO UTILIZADO:</label>
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

    {/* Tipos de Trabajo */}
    <div className="mt-4">
        <label className="block font-semibold">Tipos de Trabajo:</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(formData.tiposTrabajo).map((key) => (
                <label key={key} className="flex items-center">
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
        {errorTiposTrabajo && (
        <p className="text-red-500 text-sm mt-1">Debe seleccionar al menos un tipo de trabajo.</p>
    )}
    </div>

    {/* Tabla Detalle de Equipos */}


    <div className="mt-4">
    <h3 className="text-lg font-semibold">Detalle de Equipos</h3>
    <div className="overflow-x-auto">
      <table className="w-full border mt-2 text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Cantidad</th>
            <th className="border p-2">Código</th>
            <th className="border p-2">Descripción y Serie</th>
            <th className="border p-2">Marca</th>
            <th className="border p-2">Modelo</th>
            <th className="border p-2 ">Del</th>
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
              <td className="border p-2">
                <button
                  type="button"
                  onClick={() => handleDeleteFila(index)}
                  className="px-2 py-1 bg-red-500  text-white rounded"
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button
      type="button"
      onClick={agregarFila}
      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
    >
      Agregar Línea
    </button>
  </div>

    {/* Información de Trabajo y Recibido */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="border p-4 rounded">
            <h3 className="font-semibold">Trabajo Realizado Por</h3>
            {[{ label: "Nombre", name: "trabajo_realizado_por", type: "text" },
              { label: "Fecha Entrega", name: "fecha_entrega", type: "date" },
              { label: "Hora Inicio", name: "hora_inicio", type: "time" },
              { label: "Hora Final", name: "hora_final", type: "time" }]
              .map(({ label, name, type }) => (
                <div key={name}>
                    <label>{label}:</label>
                    <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        min={type === "date" ? todayCostaRica : ""}
                        max={type === "date" ? todayCostaRica : ""}
                        className="w-full border rounded p-2"
                        required
                    />
                </div>
            ))}
        </div>

        <div className="border p-4 rounded">
    <h3 className="font-semibold">Recibido Conforme</h3>

    {[
        { label: "Nombre", name: "recibido_por", type: "text" },
        { label: "Correo Del Cliente", name: "correo_cliente", type: "email" },
        { label: "Fecha", name: "fecha_recibido", type: "date" },
        { label: "Hora", name: "hora_recibido", type: "time" }
    ].map(({ label, name, type }) => (
        <div key={name}>
            <label>{label}:</label>
            <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}                
                min={type === "date" ? todayCostaRica : ""}
                max={type === "date" ? todayCostaRica : ""}
                className="w-full border rounded p-2"
                required
            />
        </div>
    ))}

    {/* Firma Digital */}
    <div className="mt-4 border p-4 rounded">
        <h3 className="font-semibold">Firma Recibido:</h3>
        <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
                className: "border w-full h-32 bg-gray-100 rounded"
            }}
        />
        <div className="flex space-x-2 mt-2">
            <button 
                type="button" 
                onClick={guardarFirma} 
                className="px-4 py-2 bg-green-500 text-white rounded"
            >
                Guardar Firma
            </button>
            <button 
                type="button" 
                onClick={limpiarFirma} 
                className="px-4 py-2 bg-red-500 text-white rounded"
            >
                Limpiar
            </button>
        </div>
    </div>
</div>

    </div>

    {/* Botón de Enviar */}
    <button type="submit" className="mt-4 px-4 py-2 bg-green-500 text-white rounded w-full">
        Registrar Ticket
    </button>
</form>


        
    );
};

export default FormularioInventario;
