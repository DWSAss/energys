const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
require("dotenv").config(); // Загрузка переменных окружения
const path = require("path");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Отдача статических файлов React
app.use(express.static(path.join(__dirname, '../client/build')));


// Настройка подключения к базе данных через переменные окружения
const connection = mysql.createConnection({
    host: process.env.DB_HOST,     // Используем переменную окружения
    user: process.env.DB_USER,     // Используем переменную окружения
    password: process.env.DB_PASSWORD, // Используем переменную окружения
    database: process.env.DB_NAME, // Используем переменную окружения
    port: process.env.DB_PORT,     // Используем переменную окружения
});


// Проверка подключения
connection.connect((err) => {
    if (err) {
        console.error("Ошибка подключения к базе данных:", err.stack);
        return;
    }
    console.log("Успешное подключение к базе данных");
});

// Функция для аутентификации токена
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ error: "Нет токена" });
    }

    jwt.verify(token, 'secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Неверный токен" });
        }
        req.user = decoded;  // Декодированный токен добавляется в req.user
        next();
    });
};

// Проверка прав администратора
const verifyAdmin = (req, res, next) => {
    if (req.user.isAdmin !== 1) {
        return res.status(403).json({ error: "Нет прав администратора" });
    }
    next();
};

// Маршрут для регистрации
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    if (password.length < 8) {
        return res.status(400).json({ error: "Пароль слишком короткий. Минимальная длина пароля - 8 символов." });
    }

    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    connection.query(checkQuery, [email], (err, result) => {
        if (err) {
            console.error('Ошибка выполнения запроса: ', err);
            return res.status(500).json({ error: 'Ошибка выполнения запроса' });
        }

        if (result.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        connection.query(query, [name, email, password], (err, result) => {
            if (err) {
                console.error('Ошибка регистрации пользователя: ', err);
                return res.status(500).json({ error: 'Ошибка регистрации пользователя' });
            }
            res.status(201).json({ message: 'Пользователь зарегистрирован успешно' });
        });
    });
});

// Маршрут для входа
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    connection.query(query, [email], (err, result) => {
        if (err) {
            console.error('Ошибка выполнения запроса при входе: ', err);
            return res.status(500).json({ error: 'Ошибка входа' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Прямое сравнение паролей
        if (password !== result[0].password) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }

        const token = jwt.sign(
            { id: result[0].id, names: result[0].name, email: result[0].email, isAdmin: result[0].isAdmin },
            'secret_key',
            { expiresIn: '1h' }
        );
        console.log(result.name, result.email)
        console.log(names, email, id)
        res.status(200).json({ token });
    });
});

// Обработчик для корневого маршрута
app.get("/", (req, res) => {
    res.send("Сервер работает! Добро пожаловать в API.");
});

// Обработчик для всех остальных маршрутов
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// Маршрут для получения данных о текущем пользователе
app.get('/account', authenticateToken, (req, res) => {
    const userId = req.user.id;  // Получаем ID из декодированного токена

    const query = 'SELECT * FROM users WHERE id = ?';
    connection.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Ошибка выполнения запроса:', err);
            return res.status(500).json({ error: 'Ошибка получения данных пользователя' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(result[0]);
    });
});


// Пример использования функции проверки прав администратора
app.get("/admin/users", authenticateToken, verifyAdmin, (req, res) => {
    const query = 'SELECT * FROM users';
    connection.query(query, (err, result) => {
        if (err) {
            console.error('Ошибка получения пользователей: ', err);
            return res.status(500).json({ error: 'Ошибка получения пользователей' });
        }
        res.status(200).json(result);
    });
});

// Удаление пользователя
app.delete("/admin/users/:id", authenticateToken, verifyAdmin, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM users WHERE id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Ошибка удаления пользователя: ', err);
            return res.status(500).json({ error: 'Ошибка удаления пользователя' });
        }
        res.status(200).json({ success: true });
    });
});

// Запуск сервера
const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

