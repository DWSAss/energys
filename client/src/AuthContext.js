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

    const updateAuthState = (token, role, name) => {
        localStorage.setItem("token", token);
        localStorage.setItem("role", role); // Сохраняем роль пользователя
        localStorage.setItem("name", name); // Сохраняем имя пользователя как "name"
        setIsAuthenticated(!!token);
        setRole(role);  // Устанавливаем роль
        setUserName(name); // Устанавливаем имя пользователя
    };

    return (
        <AuthContext.Provider value={{ role, isAuthenticated, userName, updateAuthState }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
