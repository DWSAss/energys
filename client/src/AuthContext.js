import { createContext, useContext, useState, useEffect } from "react";

// Контекст для авторизации
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [role, setRole] = useState(null);  // Храним роль пользователя
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState(null);  // Добавляем поле для имени пользователя

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role"); // Получаем роль пользователя
        const storedName = localStorage.getItem("name"); // Получаем имя пользователя из localStorage

        console.log("userName из localStorage:", storedName); // Лог для отладки
        setRole(storedRole);
        setUserName(storedName); // Устанавливаем имя пользователя
        setIsAuthenticated(!!token);
    }, []);

    const decodeToken = (token) => {
        try {
            const base64Url = token.split(".")[1]; // Получаем payload
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const decodedData = JSON.parse(decodeURIComponent(escape(atob(base64)))); // Декодируем корректно
            return decodedData;
        } catch (e) {
            console.error("Ошибка при декодировании токена:", e);
            return {};
        }
    };
    
    
    const updateAuthState = (token, role) => {
        const decoded = decodeToken(token); // Декодируем токен
        const name = decoded.name || "Гость"; // Извлекаем имя
    
        console.log("Декодированные данные из токена:", decoded);
    
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("name", name); // Теперь имя должно сохраняться
    
        setIsAuthenticated(!!token);
        setRole(role);
        setUserName(name);
    };

    useEffect(() => {
        const storedName = localStorage.getItem("name");
        console.log("Имя пользователя из localStorage:", storedName); 
    }, []);
    
    return (
        <AuthContext.Provider value={{ role, isAuthenticated, userName, updateAuthState }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
