import React from "react";
import ReactDOM from "react-dom/client"; // Импортируем новый способ рендеринга с React 18
import App from "./App";
import { AuthProvider } from "./AuthContext"; // Ваш контекст

// Создаём root и монтируем приложение
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
