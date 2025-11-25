const API_BASE_URL = "https://evaluacion-s29l.onrender.com/api";

let chartInstance = null;

async function obtenerToken() {
    const username = document.getElementById('api-username').value;
    const password = document.getElementById('api-password').value;
    const msgLabel = document.getElementById('login-message');

    if (!username || !password) {
        mostrarMensajeLogin("Ingresa usuario y contraseña", "text-red-500");
        return;
    }

    mostrarMensajeLogin("Conectando con el servidor...", "text-blue-500");

    try {
        const response = await fetch(`${API_BASE_URL}/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            mostrarMensajeLogin("¡Login Correcto! Redirigiendo...", "text-green-600");
            setTimeout(mostrarPanelDatos, 800);
        } else {
            mostrarMensajeLogin("Usuario o contraseña incorrectos", "text-red-600");
        }
    } catch (error) {
        console.error("Error Login:", error);
        mostrarMensajeLogin("Error de conexión. Revisa la URL de la API.", "text-red-600");
    }
}

function mostrarMensajeLogin(texto, claseColor) {
    const msg = document.getElementById('login-message');
    msg.innerText = texto;
    msg.className = `text-center text-sm font-medium min-h-[24px] mt-2 ${claseColor}`;
}

async function cargarVisitas() {
    const token = localStorage.getItem('access_token');
    const refreshIcon = document.getElementById('refresh-icon');
    
    if (!token) {
        cerrarSesion();
        return;
    }

    if(refreshIcon) refreshIcon.classList.add('spin-anim');

    try {
        const response = await fetch(`${API_BASE_URL}/visita/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const lista = Array.isArray(data) ? data : (data.results || []);
            
            actualizarDashboard(lista);
            renderizarTabla(lista);
        } else if (response.status === 401) {
            alert("Sesión expirada");
            cerrarSesion();
        }
    } catch (error) {
        console.error("Error Datos:", error);
        alert("Error al cargar los datos de la API");
    } finally {
        if(refreshIcon) refreshIcon.classList.remove('spin-anim');
    }
}

function actualizarDashboard(listaVisitas) {
    const hoy = new Date().toISOString().split('T')[0];

    let totalHoy = 0;
    let totalActivas = 0;
    let totalFinalizadas = 0;

    listaVisitas.forEach(visita => {
        if (visita.fecha === hoy) {
            totalHoy++;
        }

        if (visita.estado === 'EN_CURSO') {
            totalActivas++;
        } else if (visita.estado === 'FINALIZADA') {
            totalFinalizadas++;
        }
    });

    animarNumero('stat-hoy', totalHoy);
    animarNumero('stat-activas', totalActivas);
    animarNumero('stat-finalizadas', totalFinalizadas);

    document.getElementById('total-registros').innerText = `${listaVisitas.length} registros`;
}

function animarNumero(idElemento, valorFinal) {
    const elemento = document.getElementById(idElemento);
    elemento.innerText = valorFinal;
}

function renderizarTabla(lista) {
    const tabla = document.getElementById('tabla-body');
    tabla.innerHTML = '';

    if (lista.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-400">
                    <i class="bi bi-inbox text-4xl block mb-2 opacity-50"></i>
                    No hay visitas registradas.
                </td>
            </tr>`;
        return;
    }

    lista.forEach(v => {
        const fechaObj = new Date(v.hora_entrada);
        const hora = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const badgeClass = v.estado === 'FINALIZADA' 
            ? 'bg-gray-100 text-gray-600 border-gray-200' 
            : 'bg-green-100 text-green-700 border-green-200 animate-pulse';
        
        const iconEstado = v.estado === 'FINALIZADA' 
            ? '<i class="bi bi-check-circle"></i>' 
            : '<i class="bi bi-activity"></i>';

        const row = `
            <tr class="hover:bg-blue-50 transition duration-150 group">
                <td class="px-6 py-4 font-mono text-xs text-gray-400 group-hover:text-blue-500">#${v.id}</td>
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-800">${v.nombre} ${v.apellido || ''}</div>
                </td>
                <td class="px-6 py-4 text-gray-600 font-mono text-xs">${v.rut}</td>
                <td class="px-6 py-4 text-gray-500 italic text-xs max-w-[200px] truncate" title="${v.motivo}">${v.motivo}</td>
                <td class="px-6 py-4">
                    <span class="${badgeClass} px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit">
                        ${iconEstado} ${v.estado.replace('_', ' ')}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                    <div class="flex flex-col">
                        <span class="font-bold">${v.fecha}</span>
                        <span class="text-xs text-gray-400">${hora}</span>
                    </div>
                </td>
            </tr>
        `;
        tabla.innerHTML += row;
    });
}

function mostrarPanelDatos() {
    const token = localStorage.getItem('access_token');
    if (token) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('data-section').classList.remove('hidden');
        document.getElementById('data-section').classList.remove('opacity-0', 'translate-y-4');
        document.getElementById('token-display').innerText = `Key: ${token.substring(0, 15)}...${token.substring(token.length-5)}`;
        
        cargarVisitas();
    }
}

function cerrarSesion() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('access_token')) {
        mostrarPanelDatos();
    } else {
        document.getElementById('login-section').classList.remove('opacity-0');
    }

    const style = document.createElement('style');
    style.innerHTML = `
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
});