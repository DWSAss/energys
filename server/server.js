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

// Логирование запросов
app.use((req, res, next) => {
    console.log(`📥 [${req.method}] ${req.url}`, req.body);
    next();
});

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
        console.error("❌ Ошибка подключения к БД:", err);
        return;
    }
    console.log("✅ Успешное подключение к базе данных");
});

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

// Проверка токена
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
        console.warn("⚠️ Нет токена в запросе");
        return res.status(403).json({ error: "Нет токена" });
    }
    console.log("🔑 Проверка токена:", token);
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("❌ Ошибка верификации токена:", err.message);
            return res.status(401).json({ error: "Неверный токен" });
        }
        console.log("✅ Токен валиден. Декодированные данные:", decoded);
        req.user = decoded;
        next();
    });
};

// Проверка прав администратора
const verifyAdmin = (req, res, next) => {
    if (req.user.isAdmin !== 1) {
        console.warn(`⚠️ Пользователь ${req.user.id} пытался получить доступ к админ-разделу`);
        return res.status(403).json({ error: "Нет прав администратора" });
    }
    next();
};

// Регистрация пользователя
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;
    console.log("📩 Регистрация пользователя:", { name, email });

    if (password.length < 8) {
        console.warn("⚠️ Пароль слишком короткий");
        return res.status(400).json({ error: "Пароль слишком короткий" });
    }

    const checkQuery = "SELECT * FROM Holodka WHERE email = ?";
    connection.query(checkQuery, [email], (err, result) => {
        if (err) {
            console.error("❌ Ошибка проверки пользователя:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }
        if (result.length > 0) {
            console.warn(`⚠️ Пользователь с email ${email} уже существует`);
            return res.status(400).json({ error: "Пользователь уже существует" });
        }

        const insertQuery = "INSERT INTO Holodka (name, email, password, isAdmin) VALUES (?, ?, ?, 0)";
        connection.query(insertQuery, [name, email, password], (err) => {
            if (err) {
                console.error("❌ Ошибка при регистрации:", err);
                return res.status(500).json({ error: "Ошибка сервера" });
            }
            console.log(`✅ Пользователь ${email} зарегистрирован`);
            res.status(201).json({ message: "Пользователь зарегистрирован" });
        });
    });
});

// Логин
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log("🔑 Попытка входа:", email);

    const query = "SELECT * FROM Holodka WHERE email = ?";
    connection.query(query, [email], (err, result) => {
        if (err) {
            console.error("❌ Ошибка при логине:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }
        if (result.length === 0) {
            console.warn("⚠️ Пользователь не найден:", email);
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const user = result[0];
        if (password !== user.password) {
            console.warn("⚠️ Неверный пароль для:", email);
            return res.status(401).json({ error: "Неверный пароль" });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: "6h" }
        );

        console.log("✅ Пользователь вошел:", email);
        res.status(200).json({ token });
    });
});

// Получение информации о пользователе
app.get("/account", authenticateToken, (req, res) => {
    console.log(`👤 Запрос данных пользователя: ${req.user.id}`);

    const userId = req.user.id;
    const query = "SELECT id, name, email, isAdmin FROM Holodka WHERE id = ?";
    connection.query(query, [userId], (err, result) => {
        if (err) {
            console.error("❌ Ошибка получения данных:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }
        if (result.length === 0) {
            console.warn("⚠️ Пользователь не найден:", userId);
            return res.status(404).json({ message: "Пользователь не найден" });
        }
        console.log("✅ Данные пользователя:", result[0]);
        res.json(result[0]);
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на порту ${port}`);
});
