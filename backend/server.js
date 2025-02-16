require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");


const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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


app.post("/tickets", protect, (req, res) => {
    const {
        cliente, codigo_cliente, proyecto, fecha_reporte, solicitante,
        oc_cliente, direccion, ticket_venta, labores_realizadas, observaciones,
        fecha_entrega, hora_inicio, hora_final, firma_trabajo,
        recibido_por, fecha_recibido, hora_recibido, firma_recibido, detalle_equipos,
        venta, alquiler, consumo, entrega_equipo, soporte_tecnico, visita_previa, atencion_averia, entrada_equipo
    } = req.body;

    const userId = req.user.id; 
    const userEmail = req.user.email; // Email del usuario autenticado

    db.query("SELECT MAX(id) + 1 AS nextId FROM tickets", (err, result) => {
        if (err) return res.status(500).json({ error: err });
        const nextId = result[0].nextId || 1;
        const consecutivo = `A-${nextId.toString().padStart(4, '0')}`;

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
            INSERT INTO tickets (consecutivo, user_id, cliente, codigo_cliente, proyecto, fecha_reporte,
                solicitante, oc_cliente, direccion, ticket_venta, labores_realizadas, observaciones,
                trabajo_realizado_por, fecha_entrega, hora_inicio, hora_final, firma_trabajo,
                recibido_por, fecha_recibido, hora_recibido, firma_recibido,
                venta, alquiler, consumo, entrega_equipo, soporte_tecnico, visita_previa, atencion_averia, entrada_equipo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            consecutivo, userId, cliente, codigo_cliente, proyecto, fecha_reporte, solicitante,
            oc_cliente, direccion, ticket_venta, labores_realizadas, observaciones,
            userEmail, fecha_entrega, hora_inicio, hora_final, firmaTrabajoPath,
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

                        // Enviar correo después de insertar el ticket
                        enviarCorreoNotificacion(userEmail, consecutivo, cliente, solicitante);
                        
                        res.json({ message: "Ticket registrado con éxito", consecutivo });
                    }
                );
            } else {
                // Enviar correo después de insertar el ticket
                enviarCorreoNotificacion(userEmail, consecutivo, cliente, solicitante);

                res.json({ message: "Ticket registrado sin detalles de equipos", consecutivo });
            }
        });
    });
});

// Función para enviar el correo de notificación
function enviarCorreoNotificacion(toEmail, consecutivo, cliente, solicitante) {
  const msg = {
    to: toEmail, 
    from: "gzadrian13@gmail.com",
    subject: `Tu nuevo ticket ha sido creado: ${consecutivo}`,
    html: `
      <h2>¡Ticket registrado con éxito!</h2>
      <p><strong>Consecutivo:</strong> ${consecutivo}</p>
      <p><strong>Cliente:</strong> ${cliente}</p>
      <p><strong>Solicitante:</strong> ${solicitante}</p>
      <p>Gracias por usar el sistema de tickets. Puedes revisar los detalles en la aplicación.</p>
    `,
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log(`Correo de notificación enviado a ${toEmail}`);
    })
    .catch((error) => {
      console.error("Error al enviar notificación:", error);
    });
}

// app.post("/tickets",protect, (req, res) => {
//     const {
//         cliente, codigo_cliente, proyecto, fecha_reporte, solicitante,
//         oc_cliente, direccion, ticket_venta, labores_realizadas, observaciones,
//         trabajo_realizado_por, fecha_entrega, hora_inicio, hora_final, firma_trabajo,
//         recibido_por, fecha_recibido, hora_recibido, firma_recibido, detalle_equipos,
//         venta, alquiler, consumo, entrega_equipo, soporte_tecnico, visita_previa, atencion_averia, entrada_equipo
//     } = req.body;

//     db.query("SELECT MAX(id) + 1 AS nextId FROM tickets", (err, result) => {
//         if (err) return res.status(500).json({ error: err });
//         const nextId = result[0].nextId || 1;
//         const consecutivo = `A-${nextId.toString().padStart(4, '0')}`;

//         // Directorio donde se guardarán las firmas
//         const firmaPath = path.join(__dirname, "firmas");
//         if (!fs.existsSync(firmaPath)) fs.mkdirSync(firmaPath);

//         // Guardar firma de trabajo
//         let firmaTrabajoPath = "";
//         if (firma_trabajo && firma_trabajo.startsWith("data:image")) {
//             firmaTrabajoPath = `firmas/firma_trabajo_${nextId}.png`;
//             const base64Data = firma_trabajo.replace(/^data:image\/png;base64,/, "");
//             fs.writeFileSync(firmaTrabajoPath, base64Data, "base64");
//         }

//         // Guardar firma de recibido
//         let firmaRecibidoPath = "";
//         if (firma_recibido && firma_recibido.startsWith("data:image")) {
//             firmaRecibidoPath = `firmas/firma_recibido_${nextId}.png`;
//             const base64Data = firma_recibido.replace(/^data:image\/png;base64,/, "");
//             fs.writeFileSync(firmaRecibidoPath, base64Data, "base64");
//         }

//         const sql = `
//             INSERT INTO tickets (consecutivo, user_id, cliente, codigo_cliente, proyecto, fecha_reporte,
//                 solicitante, oc_cliente, direccion, ticket_venta, labores_realizadas, observaciones,
//                 trabajo_realizado_por, fecha_entrega, hora_inicio, hora_final, firma_trabajo,
//                 recibido_por, fecha_recibido, hora_recibido, firma_recibido,
//                 venta, alquiler, consumo, entrega_equipo, soporte_tecnico, visita_previa, atencion_averia, entrada_equipo)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//         const values = [
//             consecutivo, req.user.id, cliente, codigo_cliente, proyecto, fecha_reporte, solicitante,
//             oc_cliente, direccion, ticket_venta, labores_realizadas, observaciones,
//             trabajo_realizado_por, fecha_entrega, hora_inicio, hora_final, firmaTrabajoPath,
//             recibido_por, fecha_recibido, hora_recibido, firmaRecibidoPath,
//             venta ? 1 : 0, alquiler ? 1 : 0, consumo ? 1 : 0, entrega_equipo ? 1 : 0,
//             soporte_tecnico ? 1 : 0, visita_previa ? 1 : 0, atencion_averia ? 1 : 0, entrada_equipo ? 1 : 0
//         ];

//         db.query(sql, values, (err, result) => {
//             if (err) return res.status(500).json({ error: err });

//             const ticketId = result.insertId;

//             if (detalle_equipos && detalle_equipos.length > 0) {
//                 const detalleValues = detalle_equipos.map(d => [
//                     ticketId, d.cantidad, d.codigo, d.descripcion_serie, d.marca, d.modelo
//                 ]);

//                 db.query(
//                     `INSERT INTO detalle_equipos (ticket_id, cantidad, codigo, descripcion_serie, marca, modelo)
//                     VALUES ?`,
//                     [detalleValues],
//                     (err) => {
//                         if (err) return res.status(500).json({ error: err });
//                         res.json({ message: "Ticket registrado con éxito", consecutivo });
//                     }
//                 );
//             } else {
//                 res.json({ message: "Ticket registrado sin detalles de equipos", consecutivo });
//             }
//         });
//     });
// });

// Registrar un usuario
// Registrar un usuario con verificación
app.post("/register", async (req, res) => {
    try {
      const { nombre, email, password } = req.body;
      if (!nombre || !email || !password) {
        return res.status(400).json({ message: "Faltan campos requeridos." });
      }
  
      // Asegurar dominio permitido
      if (!email.endsWith("@bluesat.cr") && !email.endsWith("@revify.cr")) {
        return res.status(400).json({ message: "El dominio de correo no está permitido." });
      }
  
      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Generar token de verificación
      const verificationToken = crypto.randomBytes(20).toString("hex");
  
      // Insertar en la tabla 'users' con token_verificacion y verificado=false
      const sql = `
        INSERT INTO users (nombre, email, password, token_verificacion, verificado)
        VALUES (?, ?, ?, ?, false)
      `;
      db.query(sql, [nombre, email, hashedPassword, verificationToken], (err) => {
        if (err) {
          console.error("Error insertando usuario:", err);
          return res.status(500).json({ error: err });
        }
  
        // Enviar correo de verificación
        const verificationLink = `http://localhost:3001/verify-email/${verificationToken}`;
        const msg = {
          to: email,
          from: "gzadrian13@gmail.com", // ¡Asegúrate de que coincida con tu Single Sender!
          subject: "Verifica tu cuenta",
          html: `<p>Hola ${nombre}, gracias por registrarte. 
                 Haz clic <a href="${verificationLink}">aquí</a> para verificar tu cuenta.</p>
                 <p>Si no has solicitado el registro, ignora este correo.</p>`
        };
  
        sgMail.send(msg)
          .then(() => {
            return res.json({
              message: "Usuario registrado. Revisa tu correo para verificar la cuenta."
            });
          })
          .catch((sendErr) => {
            console.error("Error enviando correo de verificación:", sendErr);
            return res.status(500).json({ error: "Usuario registrado, pero no se pudo enviar el correo de verificación." });
          });
      });
    } catch (error) {
      console.error("Error registrando usuario:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
// Verificar correo electrónico
  app.get("/verify-email/:token", (req, res) => {
    const { token } = req.params;
    const sqlSelect = "SELECT * FROM users WHERE token_verificacion = ?";
    db.query(sqlSelect, [token], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0) {
        return res.status(400).json({ message: "Token inválido o ya usado" });
      }
  
      const user = results[0];
      const sqlUpdate = `
        UPDATE users
        SET verificado = true, token_verificacion = NULL
        WHERE id = ?
      `;
      db.query(sqlUpdate, [user.id], (err2) => {
        if (err2) return res.status(500).json({ error: err2 });
        return res.redirect("http://localhost:5173/");
      });
    });
  });
  
  


// Iniciar sesión con JWT
app.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Verificar campos requeridos
      if (!email || !password) {
        return res.status(400).json({ message: "Faltan campos requeridos." });
      }
  
      // Buscar usuario por email
      const sql = `SELECT * FROM users WHERE email = ?`;
      db.query(sql, [email], async (err, results) => {
        if (err) {
          console.error("Error buscando usuario:", err);
          return res.status(500).json({ error: err });
        }
  
        if (results.length === 0) {
          return res.status(400).json({ message: "Credenciales inválidas (usuario no encontrado)." });
        }
  
        const user = results[0];
  
        // Comparar contraseña
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return res.status(400).json({ message: "Credenciales inválidas (contraseña incorrecta)." });
        }
  
        // Generar token JWT
        // Asegúrese de tener una variable JWT_SECRET en su archivo .env
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });
  
        // Respuesta
        res.json({
          message: "Inicio de sesión exitoso",
          token,
        });
      });
    } catch (error) {
      console.error("Error en /login:", error);
      res.status(500).json({ error: error.message });
    }
  });

// Enviar correo de prueba
  app.post("/send-test-email", async (req, res) => {
    try {
      const { toEmail } = req.body;
      if (!toEmail) {
        return res.status(400).json({ message: "Falta el correo de destino" });
      }
  
      const msg = {
        to: toEmail,
        from: "gzadrian13@gmail.com",
        subject: "Correo de prueba",
        text: "Hola, este es un correo de prueba con SendGrid",
        html: "<strong>Hola, este es un correo de prueba con SendGrid</strong>",
      };
  
      await sgMail.send(msg);
  
      res.json({ message: `Correo enviado a ${toEmail}` });
    } catch (error) {
      console.error("Error enviando correo:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
// Middleware para proteger rutas 
  function protect(req, res, next) {
    const token = req.header("Authorization");
    if (!token) {
      return res.status(401).json({ message: "No autorizado, falta token" });
    }
    try {
      // Verifica el token
      const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
      req.user = decoded; // { id: X, email: X, iat, exp... }
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token inválido" });
    }
  }


// Restablecer contraseña

app.post("/forgot-password", (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "El correo es obligatorio." });
    }

    // Buscar el usuario en la base de datos
    const sql = "SELECT id FROM users WHERE email = ?";
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error("Error consultando usuario:", err);
            return res.status(500).json({ message: "Error en el servidor." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const userId = results[0].id;
        const token = crypto.randomBytes(20).toString("hex");
        const expiration = new Date(Date.now() + 3600000); // 1 hora

        // Guardar el token en la base de datos
        const updateSql = "UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE id = ?";
        db.query(updateSql, [token, expiration, userId], (err) => {
            if (err) {
                console.error("Error guardando token:", err);
                return res.status(500).json({ message: "Error en el servidor." });
            }

            // Enviar correo con el enlace de restablecimiento
            const resetLink = `http://localhost:5173/reset-password/${token}`;
            const msg = {
                to: email,
                from: "gzadrian13@gmail.com",
                subject: "Recuperación de contraseña",
                text: `Haga clic en el siguiente enlace para restablecer su contraseña: ${resetLink}`,
                html: `<p>Haga clic en el siguiente enlace para restablecer su contraseña:</p><p><a href="${resetLink}">${resetLink}</a></p>`
            };

            sgMail.send(msg)
                .then(() => res.json({ message: "Correo enviado con éxito." }))
                .catch(error => {
                    console.error("Error enviando correo:", error.response?.data || error);
                    res.status(500).json({ message: "No se pudo enviar el correo." });
                });
        });
    });
});


// Restablecer contraseña
app.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Faltan campos" });
    }

    // Buscar usuario por token
    const sqlSelect = `
      SELECT * FROM users
      WHERE reset_token = ? 
        AND reset_token_expiration > NOW()
    `;
    db.query(sqlSelect, [token], async (err, results) => {
      if (err) {
        console.error("Error en /reset-password:", err);
        return res.status(500).json({ error: err });
      }
      if (results.length === 0) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }

      const user = results[0];
      // Encriptar la nueva contraseña
      const hashed = await bcrypt.hash(newPassword, 10);

      // Actualizar password y limpiar token
      const sqlUpdate = `
        UPDATE users
        SET password = ?, reset_token = NULL, reset_token_expiration = NULL
        WHERE id = ?
      `;
      db.query(sqlUpdate, [hashed, user.id], (err2) => {
        if (err2) {
          console.error("Error actualizando password:", err2);
          return res.status(500).json({ error: err2 });
        }
        res.json({ message: "Contraseña restablecida correctamente" });
      });
    });
  } catch (error) {
    console.error("Error en /reset-password:", error);
    return res.status(500).json({ error: error.message });
  }
});


// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
