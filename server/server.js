const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
require("dotenv").config();
const path = require("path");

const app = express();
const port = process.env.PORT || 10001;

// Разрешаем CORS
app.use(cors({ origin: "*" }));
app.use(express.json());

// Подключение к базе данных
const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "test_db",
    port: process.env.DB_PORT || 3306,
});

connection.connect((err) => {
    if (err) {
        console.error("Ошибка подключения к БД:", err);
        return;
    }
    console.log("✅ Успешное подключение к базе данных");
});

// **ХРАНИТЕ В .env** (process.env.JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

// Проверка токена
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

// Регистрация пользователя (БЕЗ ХЕШИРОВАНИЯ)
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    if (password.length < 8) {
        return res.status(400).json({ error: "Пароль слишком короткий" });
    }

    const checkQuery = "SELECT * FROM Holodka WHERE email = ?";
    connection.query(checkQuery, [email], (err, result) => {
        if (err) return res.status(500).json({ error: "Ошибка сервера" });

        if (result.length > 0) {
            return res.status(400).json({ error: "Пользователь уже существует" });
        }

        const insertQuery = "INSERT INTO Holodka (name, email, password, isAdmin) VALUES (?, ?, ?, 0)";
        connection.query(insertQuery, [name, email, password], (err) => {
            if (err) return res.status(500).json({ error: "Ошибка сервера" });

            res.status(201).json({ message: "Пользователь зарегистрирован" });
        });
    });
});

// Логин (БЕЗ ХЕШИРОВАНИЯ)
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM Holodka WHERE email = ?";
    connection.query(query, [email], (err, result) => {
        if (err) return res.status(500).json({ error: "Ошибка сервера" });

        if (result.length === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const user = result[0];

        // Простое сравнение паролей (⚠ НЕБЕЗОПАСНО!)
        if (password !== user.password) {
            return res.status(401).json({ error: "Неверный пароль" });
        }

        // Генерация JWT токена
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: "6h" }
        );

        res.status(200).json({ token });
    });
});

// Получение информации о пользователе
app.get("/account", authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = "SELECT id, name, email, isAdmin FROM Holodka WHERE id = ?";
    connection.query(query, [userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Ошибка сервера" });

        if (result.length === 0) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        res.json(result[0]);
    });
});

// Получение списка пользователей (только для админов)
app.get("/admin/users", authenticateToken, verifyAdmin, (req, res) => {
    const query = "SELECT id, name, email, isAdmin FROM Holodka";
    connection.query(query, (err, result) => {
        if (err) return res.status(500).json({ error: "Ошибка сервера" });

        res.status(200).json(result);
    });
});

// Удаление пользователя (только админы)
app.delete("/admin/users/:id", authenticateToken, verifyAdmin, (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM Holodka WHERE id = ?";
    connection.query(query, [id], (err) => {
        if (err) return res.status(500).json({ error: "Ошибка сервера" });

        res.status(200).json({ success: true });
    });
});

// **Обслуживание статических файлов клиента**
const clientPath = path.join(__dirname, "..", "client", "build");
app.use(express.static(clientPath));

app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
});

// Запуск сервера
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на порту ${port}`);
});
