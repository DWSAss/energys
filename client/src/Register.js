import React, { useState } from "react";
import { register } from "./utils/api";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleRegister = async () => {
        setError(""); // Очистка ошибок

        if (!name || !email || !password) {
            setError("Все поля должны быть заполнены.");
            return;
        }

        if (password.length < 8) {
            setError("Пароль слишком короткий. Минимальная длина - 8 символов.");
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Введите корректный email.");
            return;
        }

        try {
            const data = await register(name, email, password);
            console.log("Registration successful:", data);
            alert("Регистрация успешна!");
        } catch (error) {
            console.error("Registration error:", error);

            if (error.response && error.response.data) {
                setError(error.response.data.message || "Ошибка при регистрации.");
            } else {
                setError("Не удалось зарегистрироваться. Попробуйте снова.");
            }
        }
    };

    return (
        <div>
            <h2>Register</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={(e) => e.preventDefault()}>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" onClick={handleRegister}>
                    Register
                </button>
            </form>
        </div>
    );
};

export default Register;
