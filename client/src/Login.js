import React, { useState } from "react";
import { login } from './utils/api';
import { useNavigate } from 'react-router-dom';
import jwtDecode from "jwt-decode"; // Исправленный импорт
import { useAuth } from "./AuthContext"; // Импорт контекста авторизации

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { updateAuthState } = useAuth(); // Используем функцию для обновления состояния

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await login(email, password);
            if (response.token) {
                const decodedToken = jwtDecode(response.token); // Декодируем токен
                const isAdmin = decodedToken.isAdmin || false;

                // Обновляем состояние в контексте
                updateAuthState(response.token, isAdmin);

                navigate("/"); // Перенаправление после успешного логина
            } else {
                setError("Не удалось войти. Проверьте введенные данные.");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Ошибка при логине. Пожалуйста, попробуйте снова.");
        }
    };

    return (
        <div className="Login">
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
