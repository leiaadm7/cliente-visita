const API_URL = "https://evaluacion-s29l.onrender.com/api/visita/";

async function cargarDashboard() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location = "index.html";
        return;
    }

    const resp = await fetch(API_URL, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await resp.json();
    const visitas = Array.isArray(data) ? data : data.results;

    // Llenar tabla
    const tabla = document.getElementById("tabla-visitas");
    tabla.innerHTML = "";

    visitas.forEach(v => {
        tabla.innerHTML += `
        <tr>
            <td>${v.id}</td>
            <td>${v.nombre} ${v.apellido ?? ""}</td>
            <td>${v.rut}</td>
            <td>${v.estado}</td>
            <td>${v.fecha}</td>
        </tr>`;
    });

    // Contar estados
    const estados = visitas.reduce((acc, v) => {
        acc[v.estado] = (acc[v.estado] || 0) + 1;
        return acc;
    }, {});

    // Renderizar gráfico
    const ctx = document.getElementById("graficoVisitas");
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(estados),
            datasets: [{
                data: Object.values(estados)
            }]
        }
    });
}

document.addEventListener("DOMContentLoaded", cargarDashboard);