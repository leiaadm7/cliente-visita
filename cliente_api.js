const API_BASE_URL = "https://evaluacion-s29l.onrender.com/api";

// Obtener token JWT
async function obtenerToken() {
    const user = document.getElementById("api-username").value;
    const pass = document.getElementById("api-password").value;
    const msg = document.getElementById("login-message");

    msg.innerText = "Conectando...";

    const resp = await fetch(`${API_BASE_URL}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
    });

    if (!resp.ok) {
        msg.innerText = "Credenciales incorrectas";
        msg.style.color = "red";
        return;
    }

    const data = await resp.json();

    localStorage.setItem("access_token", data.access);

    msg.innerText = "¡Login exitoso!";
    msg.style.color = "green";

    setTimeout(() => location.reload(), 600);
}

// Mostrar panel si hay token
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("access_token");

    if (location.pathname.includes("index")) {
        if (token) {
            document.getElementById("login-box").classList.add("hidden");
            document.getElementById("panel-box").classList.remove("hidden");
            document.getElementById("token-display").innerText =
                token.substring(0, 60) + "...";
        }
    }
});

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem("access_token");
    window.location = "index.html";
}
