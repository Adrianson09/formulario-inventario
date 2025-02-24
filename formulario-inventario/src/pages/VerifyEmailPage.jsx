import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Llama al endpoint de verificación en el backend
    fetch(`http://31.220.104.197:3001/verify-email/${token}`)
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message || "Cuenta verificada correctamente.");
        setLoading(false);
        // Redirige al login después de 3 segundos
        setTimeout(() => {
          navigate("/");
        }, 3000);
      })
      .catch((error) => {
        console.error("Error al verificar el correo:", error);
        setMessage("Error al verificar el correo.");
        setLoading(false);
        // Redirige al login después de 3 segundos
        setTimeout(() => {
          navigate("/");
        }, 3000);
      });
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Verificando Correo</h2>
        {loading ? (
          <p className="text-gray-600">Por favor, espere...</p>
        ) : (
          <p className="text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
