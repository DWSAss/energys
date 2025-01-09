import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUser, getAccountData } from "./utils/api"; 
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "./AuthContext"; // Хук для получения роли

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { role, isAuthenticated, name } = useAuth();  // Получаем роль и имя пользователя

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Токен не найден");
                navigate("/login"); 
                return;
            }

            if (role !== "1") { // Если роль не "1", то доступ закрыт
                setError("У вас нет прав для доступа к этой странице.");
                navigate("/"); 
                return;
            }

            try {
                const data = await getAllUsers(token);
                setUsers(data);
            } catch (error) {
                setError("Ошибка подключения к серверу.");
            }
        };

        if (isAuthenticated) { // Проверяем, авторизован ли пользователь
            fetchUsers();
        } else {
            setError("Пожалуйста, войдите в систему.");
            navigate("/login");
        }
    }, [role, isAuthenticated, navigate]);

    const handleDeleteUser = async (id) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Токен не найден");
            return;
        }

        try {
            const data = await deleteUser(id, token);
            if (data.success) {
                setUsers(prevUsers => prevUsers.filter(user => user.id !== id)); 
            } else {
                setError(data.message || "Не удалось удалить пользователя.");
            }
        } catch (error) {
            setError("Ошибка удаления пользователя.");
        }
    };

    return (
        <div className="admin-panel">
            <h2>Панель администратора</h2>
            {error && <p className="error">{error}</p>}
            <p>Добро пожаловать, {name}!</p> {/* Добавили приветствие с именем */}
            {users.length > 0 ? (
                <ul className="Admins">
                    {users.map((user) => (
                        <li key={user.id}>
                            {user.name} ({user.email})
                            <button className="bntAdm" onClick={() => handleDeleteUser(user.id)}>
                                Удалить
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                !error && <p>Пользователи не найдены.</p>
            )}
        </div>
    );
};

export default AdminPanel;
