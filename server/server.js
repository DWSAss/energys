const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
require("dotenv").config();
const path = require("path");

const app = express();

// Константы
const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const JWT_SECRET = "secret_key"; 
// Лучше использовать process.env.JWT_SECRET

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к БД
const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "test_db",
    port: process.env.DB_PORT || 3306,
});

// Проверка подключения
connection.connect((err) => {
    if (err) {
        console.error("Ошибка подключения к БД:", err);
        return;
    }
    console.log("✅ Успешное подключение к базе данных");
});

// Аутентификация токена
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "Нет токена" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Неверный токен" });

        req.user = decoded;
        next();
    });
};

// Проверка прав администратора (isAdmin === 1)
const verifyAdmin = (req, res, next) => {
    if (req.user.isAdmin !== 1) {
        return res.status(403).json({ error: "Нет прав администратора" });
    }
    next();
};

// Проверка прав пользователя (isAdmin === 1 или isAdmin === 2)
const verifyUser = (req, res, next) => {
    if (![1, 2].includes(req.user.isAdmin)) {
        return res.status(403).json({ error: "Нет прав пользователя" });
    }
    next();
};

// Маршрут регистрации (БЕЗ ХЕШИРОВАНИЯ ПАРОЛЯ)
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    if (password.length < 8) {
        return res.status(400).json({ error: "Пароль слишком короткий" });
    }

    // Проверяем, существует ли пользователь
    const checkQuery = "SELECT * FROM Holodka WHERE email = ?";
    connection.query(checkQuery, [email], (err, result) => {
        if (err) {
            console.error("Ошибка при проверке пользователя:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }

        if (result.length > 0) {
            return res.status(400).json({ error: "Пользователь уже существует" });
        }

        // Новый пользователь по умолчанию будет гостем (isAdmin = 0)
        const insertQuery = "INSERT INTO Holodka (name, email, password, isAdmin) VALUES (?, ?, ?, 0)";
        connection.query(insertQuery, [name, email, password], (err) => {
            if (err) {
                console.error("Ошибка при регистрации:", err);
                return res.status(500).json({ error: "Ошибка сервера" });
            }
            res.status(201).json({ message: "Пользователь зарегистрирован" });
        });
    });
});

// Маршрут входа (логина) БЕЗ ХЕШИРОВАНИЯ
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM Holodka WHERE email = ?";
    connection.query(query, [email], (err, result) => {
        if (err) {
            console.error("Ошибка входа:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const user = result[0];

        // Прямое сравнение паролей (БЕЗ ХЕШИРОВАНИЯ)
        if (password !== user.password) {
            return res.status(401).json({ error: "Неверный пароль" });
        }

        // Генерируем токен
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ token });
    });
});

// Получение информации о пользователе (доступно для всех залогиненных пользователей)
app.get("/account", authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = "SELECT id, name, email, isAdmin FROM Holodka WHERE id = ?";
    connection.query(query, [userId], (err, result) => {
        if (err) {
            console.error("Ошибка запроса:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        res.json(result[0]);
    });
});

// Получение списка пользователей (только админы)
app.get("/admin/users", authenticateToken, verifyAdmin, (req, res) => {
    const query = "SELECT id, name, email, isAdmin FROM Holodka";
    connection.query(query, (err, result) => {
        if (err) {
            console.error("Ошибка получения пользователей:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }
        res.status(200).json(result);
    });
});

// Удаление пользователя (только админы)
app.delete("/admin/users/:id", authenticateToken, verifyAdmin, (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM Holodka WHERE id = ?";
    connection.query(query, [id], (err) => {
        if (err) {
            console.error("Ошибка удаления пользователя:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }
        res.status(200).json({ success: true });
    });
});

// Специальный маршрут для пользователей (isAdmin = 1 или 2)
app.get("/user/profile", authenticateToken, verifyUser, (req, res) => {
    res.json({ message: "Доступ разрешен", user: req.user });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
