const API_BASE_URL = "https://evaluacion-s29l.onrender.com/api";

// Obtener token JWT
async function obtenerToken() {
    const username = document.getElementById("api-username").value;
    const password = document.getElementById("api-password").value;
    const msgLabel = document.getElementById("login-message");

    msgLabel.innerText = "Conectando...";
    msgLabel.className = "text-gray-500";

    try {
        const response = await fetch(`${API_BASE_URL}/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            msgLabel.innerText = "Credenciales incorrectas.";
            msgLabel.className = "text-red-600";
            return;
        }

        const data = await response.json();

        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);

        msgLabel.innerText = "¡Autenticación exitosa!";
        msgLabel.className = "text-green-600";

        setTimeout(mostrarPanelDatos, 500);
    } catch (error) {
        msgLabel.innerText = "Error de conexión.";
        msgLabel.className = "text-red-600";
    }
}

// Mostrar panel de datos cuando hay token
function mostrarPanelDatos() {
    const token = localStorage.getItem("access_token");

    if (token) {
        document.getElementById("login-section").classList.add("hidden");
        document.getElementById("data-section").classList.remove("hidden");

        document.getElementById("token-display").innerText =
            token.substring(0, 50) + "...";
    }
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.clear();
    location.reload();
}

// Cargar visitas desde la API
async function cargarVisitas() {
    const token = localStorage.getItem("access_token");
    const tabla = document.getElementById("tabla-body");
    const loader = document.getElementById("loading-indicator");

    loader.classList.remove("hidden");

    try {
        const response = await fetch(`${API_BASE_URL}/visita/`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        const lista = Array.isArray(data) ? data : data.results || [];

        tabla.innerHTML = "";

        lista.forEach(v => {
            tabla.innerHTML += `
                <tr class="hover:bg-pink-50 transition">
                    <td class="px-4 py-3">${v.id}</td>
                    <td class="px-4 py-3">${v.nombre} ${v.apellido ?? ""}</td>
                    <td class="px-4 py-3">${v.rut}</td>
                    <td class="px-4 py-3">${v.estado}</td>
                    <td class="px-4 py-3">${v.fecha}</td>
                </tr>
            `;
        });

    } finally {
        loader.classList.add("hidden");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("access_token")) mostrarPanelDatos();
});
