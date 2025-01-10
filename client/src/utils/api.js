import axios from "axios";

// Создание экземпляра axios для API
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:10000",
    headers: {
        "Content-Type": "application/json",
    },
});

// Автоматически добавляем токен в каждый запрос
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token"); // Берем токен из localStorage
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

// Перехватываем ошибки ответа (например, 401 - неавторизован)
api.interceptors.response.use(
    (response) => response, 
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("⛔ Токен недействителен! Разлогиниваем пользователя...");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login"; // Перенаправляем на страницу входа
        }
        return Promise.reject(error);
    }
);

// ✅ Регистрируем пользователя
export const register = async (name, email, password) => {
    try {
        const response = await api.post("/register", { name, email, password });
        return response.data;
    } catch (error) {
        console.error("Registration error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Ошибка регистрации");
    }
};

// ✅ Вход пользователя
export const login = async (email, password) => {
    try {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            return response.data;
        } else {
            throw new Error("Ошибка входа");
        }
    } catch (error) {
        console.error("Login API error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Ошибка входа");
    }
};

// ✅ Получение данных о пользователе
export const getAccountData = async () => {
    try {
        const response = await api.get("/account");
        return response.data;
    } catch (error) {
        console.error("Ошибка при получении данных аккаунта:", error);
        throw error;
    }
};

// ✅ Получение всех пользователей (для админов)
export const getAllUsers = async () => {
    try {
        const response = await api.get('/admin/users');
        return response.data;
    } catch (error) {
        console.error("Ошибка при получении пользователей:", error);
        throw error;
    }
};

// ✅ Удаление пользователя (для админов)
export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    } catch (error) {
        console.error("Ошибка при удалении пользователя:", error);
        throw error;
    }
};

export default api;
