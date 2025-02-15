require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");
const path = require("path");


const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("Error conectando a MySQL:", err);
        return;
    }
    console.log("Conectado a la base de datos");
});

app.use("/firmas", express.static(path.join(__dirname, "firmas")));


// Obtener el siguiente consecutivo
app.get("/consecutivo", (req, res) => {
    db.query("SELECT MAX(id) + 1 AS nextId FROM tickets", (err, result) => {
        if (err) return res.status(500).send(err);
        const nextId = result[0].nextId || 1;
        res.json({ consecutivo: `A-${nextId.toString().padStart(4, '0')}` });
    });
});

// Obtener listado de tickets con detalle de equipos


app.get("/tickets", (req, res) => {
    const query = `
        SELECT t.*, 
               d.id AS detalle_id, d.cantidad, d.codigo, d.descripcion_serie, d.marca, d.modelo
        FROM tickets t
        LEFT JOIN detalle_equipos d ON t.id = d.ticket_id
        ORDER BY t.id DESC;
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err });

        // Formatear los datos para agrupar los detalles de cada ticket
        const tickets = {};
        results.forEach(row => {
            if (!tickets[row.id]) {
                tickets[row.id] = {
                    id: row.id,
                    consecutivo: row.consecutivo,
                    cliente: row.cliente,
                    codigo_cliente: row.codigo_cliente,
                    proyecto: row.proyecto,
                    fecha_reporte: row.fecha_reporte,
                    solicitante: row.solicitante,
                    oc_cliente: row.oc_cliente,
                    direccion: row.direccion,
                    ticket_venta: row.ticket_venta,
                    labores_realizadas: row.labores_realizadas,
                    observaciones: row.observaciones,
                    trabajo_realizado_por: row.trabajo_realizado_por,
                    fecha_entrega: row.fecha_entrega,
                    hora_inicio: row.hora_inicio,
                    hora_final: row.hora_final,
                    firma_trabajo: row.firma_trabajo,
                    recibido_por: row.recibido_por,
                    fecha_recibido: row.fecha_recibido,
                    hora_recibido: row.hora_recibido,
                    firma_recibido: row.firma_recibido,
                    created_at: row.created_at,
                    
                    // Tipos de trabajo (Checkboxes)
                    venta: !!row.venta,
                    alquiler: !!row.alquiler,
                    consumo: !!row.consumo,
                    entrega_equipo: !!row.entrega_equipo,
                    soporte_tecnico: !!row.soporte_tecnico,
                    visita_previa: !!row.visita_previa,
                    atencion_averia: !!row.atencion_averia,
                    entrada_equipo: !!row.entrada_equipo,

                    detalle_equipos: []
                };
            }

            if (row.detalle_id) {
                tickets[row.id].detalle_equipos.push({
                    id: row.detalle_id,
                    cantidad: row.cantidad,
                    codigo: row.codigo,
                    descripcion_serie: row.descripcion_serie,
                    marca: row.marca,
                    modelo: row.modelo
                });
            }
        });

        res.json(Object.values(tickets));
    });
});

// Obtener un ticket por su ID
app.get("/tickets/:id", (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT t.*, 
               d.id AS detalle_id, d.cantidad, d.codigo, d.descripcion_serie, d.marca, d.modelo
        FROM tickets t
        LEFT JOIN detalle_equipos d ON t.id = d.ticket_id
        WHERE t.id = ?;
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: "Ticket no encontrado" });
        }

        // Formatear los datos para agrupar los detalles de equipos
        const ticket = {
            id: results[0].id,
            consecutivo: results[0].consecutivo,
            cliente: results[0].cliente,
            codigo_cliente: results[0].codigo_cliente,
            proyecto: results[0].proyecto,
            fecha_reporte: results[0].fecha_reporte,
            solicitante: results[0].solicitante,
            oc_cliente: results[0].oc_cliente,
            direccion: results[0].direccion,
            ticket_venta: results[0].ticket_venta,
            labores_realizadas: results[0].labores_realizadas,
            observaciones: results[0].observaciones,
            trabajo_realizado_por: results[0].trabajo_realizado_por,
            fecha_entrega: results[0].fecha_entrega,
            hora_inicio: results[0].hora_inicio,
            hora_final: results[0].hora_final,
            firma_trabajo: results[0].firma_trabajo,
            recibido_por: results[0].recibido_por,
            fecha_recibido: results[0].fecha_recibido,
            hora_recibido: results[0].hora_recibido,
            firma_recibido: results[0].firma_recibido,
            created_at: results[0].created_at,
            venta: results[0].venta,
            alquiler: results[0].alquiler,
            consumo: results[0].consumo,
            entrega_equipo: results[0].entrega_equipo,
            soporte_tecnico: results[0].soporte_tecnico,
            visita_previa: results[0].visita_previa,
            atencion_averia: results[0].atencion_averia,
            entrada_equipo: results[0].entrada_equipo,
            detalle_equipos: []
        };

        results.forEach(row => {
            if (row.detalle_id) {
                ticket.detalle_equipos.push({
                    id: row.detalle_id,
                    cantidad: row.cantidad,
                    codigo: row.codigo,
                    descripcion_serie: row.descripcion_serie,
                    marca: row.marca,
                    modelo: row.modelo
                });
            }
        });

        res.json(ticket);
    });
});


// Registrar un nuevo ticket con detalle de equipos



app.post("/tickets", (req, res) => {
    const {
        cliente, codigo_cliente, proyecto, fecha_reporte, solicitante,
        oc_cliente, direccion, ticket_venta, labores_realizadas, observaciones,
        trabajo_realizado_por, fecha_entrega, hora_inicio, hora_final, firma_trabajo,
        recibido_por, fecha_recibido, hora_recibido, firma_recibido, detalle_equipos,
        venta, alquiler, consumo, entrega_equipo, soporte_tecnico, visita_previa, atencion_averia, entrada_equipo
    } = req.body;

    db.query("SELECT MAX(id) + 1 AS nextId FROM tickets", (err, result) => {
        if (err) return res.status(500).json({ error: err });
        const nextId = result[0].nextId || 1;
        const consecutivo = `A-${nextId.toString().padStart(4, '0')}`;

        // Directorio donde se guardarán las firmas
        const firmaPath = path.join(__dirname, "firmas");
        if (!fs.existsSync(firmaPath)) fs.mkdirSync(firmaPath);

        // Guardar firma de trabajo
        let firmaTrabajoPath = "";
        if (firma_trabajo && firma_trabajo.startsWith("data:image")) {
            firmaTrabajoPath = `firmas/firma_trabajo_${nextId}.png`;
            const base64Data = firma_trabajo.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(firmaTrabajoPath, base64Data, "base64");
        }

        // Guardar firma de recibido
        let firmaRecibidoPath = "";
        if (firma_recibido && firma_recibido.startsWith("data:image")) {
            firmaRecibidoPath = `firmas/firma_recibido_${nextId}.png`;
            const base64Data = firma_recibido.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(firmaRecibidoPath, base64Data, "base64");
        }

        const sql = `
            INSERT INTO tickets (consecutivo, cliente, codigo_cliente, proyecto, fecha_reporte,
                solicitante, oc_cliente, direccion, ticket_venta, labores_realizadas, observaciones,
                trabajo_realizado_por, fecha_entrega, hora_inicio, hora_final, firma_trabajo,
                recibido_por, fecha_recibido, hora_recibido, firma_recibido,
                venta, alquiler, consumo, entrega_equipo, soporte_tecnico, visita_previa, atencion_averia, entrada_equipo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            consecutivo, cliente, codigo_cliente, proyecto, fecha_reporte, solicitante,
            oc_cliente, direccion, ticket_venta, labores_realizadas, observaciones,
            trabajo_realizado_por, fecha_entrega, hora_inicio, hora_final, firmaTrabajoPath,
            recibido_por, fecha_recibido, hora_recibido, firmaRecibidoPath,
            venta ? 1 : 0, alquiler ? 1 : 0, consumo ? 1 : 0, entrega_equipo ? 1 : 0,
            soporte_tecnico ? 1 : 0, visita_previa ? 1 : 0, atencion_averia ? 1 : 0, entrada_equipo ? 1 : 0
        ];

        db.query(sql, values, (err, result) => {
            if (err) return res.status(500).json({ error: err });

            const ticketId = result.insertId;

            if (detalle_equipos && detalle_equipos.length > 0) {
                const detalleValues = detalle_equipos.map(d => [
                    ticketId, d.cantidad, d.codigo, d.descripcion_serie, d.marca, d.modelo
                ]);

                db.query(
                    `INSERT INTO detalle_equipos (ticket_id, cantidad, codigo, descripcion_serie, marca, modelo)
                    VALUES ?`,
                    [detalleValues],
                    (err) => {
                        if (err) return res.status(500).json({ error: err });
                        res.json({ message: "Ticket registrado con éxito", consecutivo });
                    }
                );
            } else {
                res.json({ message: "Ticket registrado sin detalles de equipos", consecutivo });
            }
        });
    });
});



// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
