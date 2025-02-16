import { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setIsLoading(true);

        try {
            const response = await axios.post("http://localhost:3001/forgot-password", { email });
            setMessage(response.data.message);
        } catch (err) {
            setError("No se pudo enviar el correo. Verifica que el email esté registrado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Recuperar Contraseña</h2>

                {message && <p className="text-green-600 text-sm text-center mb-4">{message}</p>}
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-semibold text-gray-700">Correo:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-lg font-semibold"
                        disabled={isLoading}
                    >
                        {isLoading ? "Enviando..." : "Enviar Enlace"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="/" className="text-blue-500 font-medium hover:underline">
                        Volver al inicio de sesión
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
