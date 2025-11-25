const API_BASE_URL = "https://evaluacion-s29l.onrender.com/api";

let chartInstance = null;

async function obtenerToken() {
    const usernameInput = document.getElementById("api-username");
    const passwordInput = document.getElementById("api-password");

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value;
    const password = passwordInput.value;

    if (!username || !password) {
        mostrarMensajeLogin("Por favor ingresa usuario y contraseña", "text-rose-500 font-bold");
        return;
    }

    mostrarMensajeLogin("Verificando credenciales...", "text-gray-500 font-medium");

    try {
        const res = await fetch(`${API_BASE_URL}/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            mostrarMensajeLogin("Acceso denegado. Verifica tus datos.", "text-rose-600 font-bold");
            return;
        }

        const data = await res.json();
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);

        mostrarMensajeLogin("¡Bienvenido! Cargando panel...", "text-emerald-500 font-bold");
        setTimeout(mostrarPanelDatos, 800);

    } catch (e) {
        mostrarMensajeLogin("Error de conexión con el servidor.", "text-rose-600 font-bold");
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
            setTimeout(() => {
                dataSec.classList.remove('opacity-0', 'translate-y-4');
            }, 50);
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
            alert("Tu sesión ha expirado.");
            cerrarSesion();
            return;
        }

        const data = await res.json();
        const lista = Array.isArray(data) ? data : data.results || [];

        const ahora = new Date();
        const hoyLocal = ahora.toLocaleDateString('en-CA');
        
        document.getElementById("fecha-hoy").innerText = hoyLocal;

        let totalHoy = 0;
        let activas = 0;
        let finalizadas = 0;

        if (tabla) tabla.innerHTML = "";

        if (lista.length === 0) {
            if (tabla) tabla.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">No hay datos disponibles.</td></tr>';
            actualizarGrafico(0, 0, 0);
            return;
        }

        lista.forEach(v => {
            if (v.fecha === hoyLocal) {
                totalHoy++;
            }

            const tieneSalida = v.hora_salida !== null && v.hora_salida !== "";
            
            if (tieneSalida) {
                finalizadas++;
            } else {
                activas++;
            }

            if (tabla) {
                const formatTime = (isoString) => {
                    if (!isoString) return "-";
                    return new Date(isoString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                };

                const horaEntrada = formatTime(v.hora_entrada);
                const horaSalida = tieneSalida 
                    ? `<span class="text-gray-800 font-medium">${formatTime(v.hora_salida)}</span>`
                    : `<span class="text-pink-400 italic text-xs bg-pink-50 px-2 py-1 rounded">Pendiente</span>`;

                const estadoBadge = tieneSalida
                    ? `<span class="bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1 rounded-full text-xs flex items-center gap-1.5 w-fit">
                         <i class="bi bi-check2-circle"></i> Finalizada
                       </span>`
                    : `<span class="bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 w-fit">
                         <i class="bi bi-activity animate-pulse"></i> En Curso
                       </span>`;

                tabla.innerHTML += `
                    <tr class="hover:bg-pink-50/60 transition border-b border-gray-50 last:border-0 group">
                        <td class="px-6 py-4 font-mono text-xs text-gray-400 group-hover:text-pink-400">#${v.id}</td>
                        <td class="px-6 py-4">
                            <div class="font-bold text-gray-800 text-sm">${v.nombre} ${v.apellido || ""}</div>
                        </td>
                        <td class="px-6 py-4 text-xs font-mono text-gray-500">${v.rut}</td>
                        <td class="px-6 py-4 text-xs text-gray-500 truncate max-w-[150px]" title="${v.motivo}">${v.motivo}</td>
                        <td class="px-6 py-4">${estadoBadge}</td>
                        <td class="px-6 py-4 text-right text-xs text-gray-600 font-mono">
                            <div>${v.fecha}</div>
                            <div class="text-gray-400">${horaEntrada}</div>
                        </td>
                        <td class="px-6 py-4 text-right text-xs text-gray-600 font-mono">${horaSalida}</td>
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
        console.error(e);
        mostrarMensajeLogin("Error cargando datos", "text-red-500");
    } finally {
        if(refreshIcon) refreshIcon.classList.remove('spin-anim');
    }
}

function actualizarGrafico(hoy, activas, finalizadas) {
    const canvas = document.getElementById("chartVisitas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (chartInstance) {
        chartInstance.destroy();
    }

    let gradientPink = ctx.createLinearGradient(0, 0, 0, 400);
    gradientPink.addColorStop(0, 'rgba(236, 72, 153, 0.9)');
    gradientPink.addColorStop(1, 'rgba(244, 63, 94, 0.5)');

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Visitas Hoy", "En Curso", "Finalizadas"],
            datasets: [{
                label: 'Cantidad',
                data: [hoy, activas, finalizadas],
                backgroundColor: [
                    gradientPink,              
                    "rgba(16, 185, 129, 0.7)",
                    "rgba(156, 163, 175, 0.7)"
                ],
                borderColor: [
                    "rgba(219, 39, 119, 1)",
                    "rgba(5, 150, 105, 1)",
                    "rgba(107, 114, 128, 1)"
                ],
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                y: { 
                    beginAtZero: true,
                    grid: { color: '#fdf2f8' },
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
    style.innerHTML = `.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);

    if (localStorage.getItem("access_token")) {
        mostrarPanelDatos();
    } else {
        const loginSection = document.getElementById('login-section');
        if (loginSection) loginSection.classList.remove('opacity-0');
    }
});