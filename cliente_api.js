const API_BASE_URL = "https://evaluacion-s29l.onrender.com/api";

let chartInstance = null;

async function obtenerToken() {
    const username = document.getElementById("api-username").value;
    const password = document.getElementById("api-password").value;
    const msgLabel = document.getElementById("login-message");

    msgLabel.innerText = "Conectando...";
    msgLabel.className = "text-gray-500";

    try {
        const res = await fetch(`${API_BASE_URL}/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            msgLabel.innerText = "Credenciales incorrectas.";
            msgLabel.className = "text-red-600";
            return;
        }

        const data = await res.json();
        localStorage.setItem("access_token", data.access);

        msgLabel.innerText = "¡Autenticación exitosa!";
        msgLabel.className = "text-green-600";

        setTimeout(mostrarPanelDatos, 500);

    } catch (e) {
        msgLabel.innerText = "Error de conexión.";
        msgLabel.className = "text-red-600";
        console.error(e);
    }
}

function mostrarPanelDatos() {
    const token = localStorage.getItem("access_token");

    if (token) {
        document.getElementById("login-section").classList.add("hidden");
        document.getElementById("data-section").classList.remove("hidden");

        document.getElementById("token-display").innerText =
            token.substring(0, 50) + "...";

        cargarVisitas();
    }
}

function cerrarSesion() {
    localStorage.clear();
    location.reload();
}

async function cargarVisitas() {
    const token = localStorage.getItem("access_token");
    const tabla = document.getElementById("tabla-body");
    const loader = document.getElementById("loading-indicator");

    loader.classList.remove("hidden");

    try {
        const res = await fetch(`${API_BASE_URL}/visita/`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        const lista = Array.isArray(data) ? data : data.results || [];

        tabla.innerHTML = "";

        let hoy = new Date().toISOString().split("T")[0];
        let totalHoy = 0;
        let activas = 0;
        let finalizadas = 0;

        lista.forEach(v => {
            if (v.fecha === hoy) totalHoy++;
            if (v.estado.toLowerCase() === "en proceso") activas++;
            if (v.estado.toLowerCase() === "finalizada") finalizadas++;

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

        // Métricas
        document.getElementById("total-hoy").innerText = totalHoy;
        document.getElementById("total-activas").innerText = activas;
        document.getElementById("total-finalizadas").innerText = finalizadas;

        // Gráfico actualizado
        actualizarGrafico(totalHoy, activas, finalizadas);

    } finally {
        loader.classList.add("hidden");
    }
}

function actualizarGrafico(hoy, activas, finalizadas) {

    const ctx = document.getElementById("chartVisitas");

    if (!ctx) {
        console.error("❌ No se encontró el elemento #chartVisitas");
        return;
    }

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Hoy", "Activas", "Finalizadas"],
            datasets: [{
                data: [hoy, activas, finalizadas],
                backgroundColor: ["#f472b6", "#86efac", "#d4d4d8"],
                borderRadius: 6
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("access_token")) {
        mostrarPanelDatos();
    }
});
