const API_BASE_URL = "https://evaluacion-s29l.onrender.com/api";

let chartInstance = null;

async function obtenerToken() {
    const usernameInput = document.getElementById("api-username");
    const passwordInput = document.getElementById("api-password");
    const msgLabel = document.getElementById("login-message");

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value;
    const password = passwordInput.value;

    if (!username || !password) {
        mostrarMensajeLogin("Por favor ingresa usuario y contraseña", "text-red-500 font-bold");
        return;
    }

    mostrarMensajeLogin("Conectando...", "text-gray-500 font-bold");

    try {
        const res = await fetch(`${API_BASE_URL}/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            mostrarMensajeLogin("Credenciales incorrectas.", "text-red-600 font-bold");
            return;
        }

        const data = await res.json();
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);

        mostrarMensajeLogin("¡Autenticación exitosa!", "text-green-600 font-bold");

        setTimeout(mostrarPanelDatos, 800);

    } catch (e) {
        mostrarMensajeLogin("Error de conexión.", "text-red-600 font-bold");
        console.error(e);
    }
}

function mostrarMensajeLogin(texto, claseColor) {
    const msg = document.getElementById('login-message');
    if (msg) {
        msg.innerText = texto;
        msg.className = `text-center text-sm font-medium min-h-[24px] mt-2 ${claseColor}`;
    }
}

function mostrarPanelDatos() {
    const token = localStorage.getItem("access_token");

    if (token) {
        const loginSec = document.getElementById("login-section");
        const dataSec = document.getElementById("data-section");

        if (loginSec) loginSec.classList.add("hidden");
        if (dataSec) {
            dataSec.classList.remove("hidden");
            // Animación suave de entrada
            setTimeout(() => {
                dataSec.classList.remove('opacity-0', 'translate-y-4');
            }, 50);
        }

        const tokenDisplay = document.getElementById("token-display");
        if (tokenDisplay) {
            tokenDisplay.innerText = `Token: ${token.substring(0, 30)}...`;
        }

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
    const refreshIcon = document.getElementById('refresh-icon');

    if (!token) {
        cerrarSesion();
        return;
    }

    if(refreshIcon) refreshIcon.classList.add('spin-anim');

    try {
        const res = await fetch(`${API_BASE_URL}/visita/`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
            alert("Tu sesión ha expirado. Por favor ingresa de nuevo.");
            cerrarSesion();
            return;
        }

        const data = await res.json();
        const lista = Array.isArray(data) ? data : data.results || [];

        const hoyStr = new Date().toISOString().split("T")[0];
        let totalHoy = 0;
        let activas = 0;
        let finalizadas = 0;

        if (tabla) tabla.innerHTML = ""; 

        if (lista.length === 0) {
            if (tabla) tabla.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400">No hay visitas registradas.</td></tr>';
            actualizarGrafico(0, 0, 0);
            return;
        }

        lista.forEach(v => {
            if (v.fecha === hoyStr) totalHoy++;

            const estado = v.estado ? v.estado.trim().toUpperCase() : "";

            if (estado.includes("CURSO") || estado.includes("PROCESO")) {
                activas++;
            } else if (estado.includes("FINAL")) {
                finalizadas++;
            }

            if (tabla) {
                const badgeClass = (estado.includes("FINAL"))
                    ? 'bg-gray-100 text-gray-600 border border-gray-200' 
                    : 'bg-green-100 text-green-700 border border-green-200 animate-pulse';

                let hora = '';
                if (v.hora_entrada) {
                    const fechaObj = new Date(v.hora_entrada);
                    hora = fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }

                tabla.innerHTML += `
                    <tr class="hover:bg-blue-50 transition border-b border-gray-100">
                        <td class="px-6 py-4 text-gray-500 font-mono text-xs">#${v.id}</td>
                        <td class="px-6 py-4 font-bold text-gray-800">${v.nombre} ${v.apellido || ""}</td>
                        <td class="px-6 py-4 text-xs font-mono text-gray-600">${v.rut}</td>
                        <td class="px-6 py-4 text-xs italic text-gray-500 max-w-[150px] truncate">${v.motivo}</td>
                        <td class="px-6 py-4">
                            <span class="${badgeClass} px-3 py-1 rounded-full text-xs font-bold">
                                ${v.estado}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">
                            <div class="flex flex-col">
                                <span>${v.fecha}</span>
                                <span class="text-xs text-gray-400">${hora}</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });

        const elHoy = document.getElementById("stat-hoy");
        const elActivas = document.getElementById("stat-activas");
        const elFin = document.getElementById("stat-finalizadas");
        const elTotal = document.getElementById("total-registros");

        if(elHoy) elHoy.innerText = totalHoy;
        if(elActivas) elActivas.innerText = activas;
        if(elFin) elFin.innerText = finalizadas;
        if(elTotal) elTotal.innerText = `${lista.length} registros`;

        actualizarGrafico(totalHoy, activas, finalizadas);

    } catch (e) {
        console.error("Error cargando datos:", e);
        mostrarMensajeLogin("Error al cargar datos.", "text-red-600");
    } finally {
        if(refreshIcon) refreshIcon.classList.remove('spin-anim');
    }
}

function actualizarGrafico(hoy, activas, finalizadas) {
    const canvas = document.getElementById("chartVisitas");

    if (!canvas) {
        console.warn("No se encontró el canvas #chartVisitas. Asegúrate de tener el HTML actualizado.");
        return;
    }

    const ctx = canvas.getContext("2d");

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Visitas Hoy", "Activas", "Finalizadas"],
            datasets: [{
                label: 'Cantidad',
                data: [hoy, activas, finalizadas],
                backgroundColor: [
                    "rgba(255, 146, 240, 0.7)", 
                    "rgba(34, 197, 94, 0.7)",  
                    "rgba(107, 114, 128, 0.7)" 
                ],
                borderColor: [
                    "rgba(255, 146, 240, 0.7)",
                    "rgb(34, 197, 94)",
                    "rgb(107, 114, 128)"
                ],
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Estadísticas en Tiempo Real'
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            scales: { 
                y: { 
                    beginAtZero: true,
                    grid: { color: '#f3f4f6' },
                    ticks: { stepSize: 1 }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    if (localStorage.getItem("access_token")) {
        mostrarPanelDatos();
    } else {
        const loginSection = document.getElementById('login-section');
        if (loginSection) loginSection.classList.remove('opacity-0');
    }
});