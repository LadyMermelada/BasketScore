/**
 * BASKET SCORE PRO - Script de Lógica Principal
 * Versión: 1.13.1
 */

let sessions = JSON.parse(localStorage.getItem('basketV_Final')) || [];
let editingId = null;
let selectedCell = null;
let charts = {};
let currentAverages = {};

// --- INICIALIZACIÓN ---
function init() {
    const grid = document.getElementById('gridOverlay');
    grid.innerHTML = '';

    // Generar la grilla de 11 columnas x 10 filas
    for (let i = 0; i < 110; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.onclick = () => openModal(i);
        grid.appendChild(cell);
    }

    // Escuchar teclas de acceso rápido (ESC y ENTER)
    window.addEventListener('keydown', (e) => {
        if (document.getElementById('modal').style.display === 'block') {
            if (e.key === 'Escape') closeModal();
            // Evitamos que ENTER cierre el modal si estamos escribiendo una Nota (textarea)
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                document.getElementById('saveBtn').click();
            }
        }
    });

    updateAll();
}

// --- LÓGICA DE DETECCIÓN RADIAL (GRADOS) ---
function detectRadialZone(cellId) {
    const col = cellId % 11;
    const row = Math.floor(cellId / 11);

    // Coordenadas relativas (Aro en col 5, row 1 aprox)
    const cellX = (col / 10) * 100;
    const cellY = (row / 9) * 100;
    const hoopX = 50;
    const hoopY = 10;

    // Calcular ángulo radial
    let angleRad = Math.atan2(cellY - hoopY, cellX - hoopX);
    let angleDeg = Math.round(Math.abs(angleRad * (180 / Math.PI) - 90) / 5) * 5;

    // Definición de zona de Triple
    const isTriple = (row >= 7 || col === 0 || col === 10 ||
                     ((col === 1 || col === 9) && row >= 5) ||
                     ((col === 2 || col === 8) && row >= 6));

    let parent = isTriple ? "3 Puntos" : "2 Puntos";
    let side = col < 5 ? "Izq." : (col > 5 ? "Der." : "");
    let zoneName = "";

    // Reglas de nomenclatura solicitadas
    if (isTriple) {
        if ((col === 0 || col === 10) && row <= 2) {
            zoneName = "Triple Lateral " + side;
        } else if ((col >= 5 && col <= 6) && row >= 7) {
            zoneName = "Triple Frontal";
        } else {
            zoneName = `Triple ${angleDeg}º ${side}`;
        }
    } else if (col >= 4 && col <= 6 && row >= 3 && row <= 5) {
        parent = "Tiro Libre";
        zoneName = "Tiro Libre";
        side = "";
    } else {
        zoneName = `2 Puntos ${angleDeg === 0 ? 'Frontal' : angleDeg + 'º'} ${side}`;
    }

    return { parent, specific: zoneName.trim() };
}

// --- GESTIÓN DEL MODAL ---
function openModal(cellId, sid = null) {
    selectedCell = cellId;
    editingId = sid;
    const s = sessions.find(x => x.id === sid);
    const info = detectRadialZone(cellId);

    document.getElementById('zoneText').innerText = info.specific.toUpperCase();
    document.getElementById('inputDate').value = s ? s.date : new Date().toISOString().split('T')[0];
    document.getElementById('inputTotal').value = s ? s.total : "";
    document.getElementById('inputMade').value = s ? s.made : "";
    document.getElementById('inputNote').value = s ? s.note || "" : "";

    const errorMsg = document.getElementById('errorMsg');
    if(errorMsg) errorMsg.style.display = 'none';

    document.getElementById('modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';

    // Foco automático en el primer input
    setTimeout(() => document.getElementById('inputTotal').focus(), 100);
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// --- PERSISTENCIA Y ACTUALIZACIÓN ---
document.getElementById('saveBtn').onclick = () => {
    const total = parseInt(document.getElementById('inputTotal').value);
    const made = parseInt(document.getElementById('inputMade').value);

    if (isNaN(total) || made > total || made < 0 || total <= 0) {
        const errorMsg = document.getElementById('errorMsg');
        if(errorMsg) errorMsg.style.display = 'block';
        return;
    }

    const info = detectRadialZone(selectedCell);
    const data = {
        id: editingId || Date.now(),
        cellId: selectedCell,
        date: document.getElementById('inputDate').value,
        total,
        made,
        zone: info.parent,
        spec: info.specific,
        note: document.getElementById('inputNote').value
    };

    if (editingId) {
        sessions = sessions.map(s => s.id === editingId ? data : s);
    } else {
        sessions.push(data);
    }

    localStorage.setItem('basketV_Final', JSON.stringify(sessions));
    closeModal();
    updateAll();
};

function updateAll() {
    updateTable();
    updateHeatmap();
    updateCharts();
}

// --- RENDERIZADO DE TABLA (ORDEN INVERSO) ---
function updateTable() {
    const body = document.getElementById('logBody');
    body.innerHTML = '';

    // Los más nuevos (ID mayor) aparecen primero
    [...sessions].sort((a,b) => b.id - a.id).forEach(s => {
        const p = Math.round((s.made / s.total) * 100);
        let color = p >= 70 ? '#4caf50' : (p >= 50 ? '#ffeb3b' : '#f44336');

        body.innerHTML += `<tr>
            <td>${s.date}</td>
            <td style="color:var(--primary); font-weight:bold">${s.spec}</td>
            <td>${s.zone}</td>
            <td>${s.made}/${s.total}</td>
            <td style="color:${color}; font-weight:bold">${p}%</td>
            <td style="font-style:italic; font-size:0.75rem; color:#888">${s.note || '-'}</td>
            <td>
                <button style="background:none; border:none; cursor:pointer;" onclick="openModal(${s.cellId}, ${s.id})">⚙️</button>
                <button style="background:none; border:none; cursor:pointer;" onclick="deleteSession(${s.id})">🗑️</button>
            </td>
        </tr>`;
    });
}

// --- HEATMAP DINÁMICO ---
function updateHeatmap() {
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(c => { c.style.background = ''; c.innerHTML = ''; });

    const realData = {};
    sessions.forEach(s => realData[s.cellId] = Math.round((s.made/s.total)*100));

    cells.forEach((cell, idx) => {
        const cellX = idx % 11, cellY = Math.floor(idx / 11);

        if (realData[idx] !== undefined) {
            let p = realData[idx];
            let r = p < 50 ? 255 : Math.round(510 - 5.1 * p);
            let g = p < 50 ? Math.round(5.1 * p) : 255;
            cell.style.backgroundColor = `rgba(${r}, ${g}, 0, 0.7)`;
            cell.innerHTML = `<span class="cell-label">${p}%</span>`;
        } else {
            // Predicción local (vecinos)
            let num = 0, den = 0;
            Object.keys(realData).forEach(rIdx => {
                const dist = Math.sqrt(Math.pow(cellX - (rIdx%11), 2) + Math.pow(cellY - Math.floor(rIdx/11), 2));
                if (dist <= 1.5) {
                    const w = 1 / Math.pow(dist,2);
                    num += realData[rIdx] * w;
                    den += w;
                }
            });
            if (den > 0) {
                let p = num / den;
                let r = p < 50 ? 255 : Math.round(510 - 5.1 * p);
                let g = p < 50 ? Math.round(5.1 * p) : 255;
                cell.style.backgroundColor = `rgba(${r}, ${g}, 0, 0.25)`;
            }
        }
    });
}

// --- GRÁFICAS (CHART.JS) ---
function updateCharts() {
    const zones = { "Tiro Libre": "tl", "2 Puntos": "2p", "3 Puntos": "3p" };
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    Object.entries(zones).forEach(([name, id]) => {
        const zoneHistory = sessions.filter(s => s.zone === name).sort((a,b) => new Date(a.date) - new Date(b.date));
        const zone30d = zoneHistory.filter(s => new Date(s.date) >= thirtyDaysAgo);

        const totalMade = zone30d.reduce((a, b) => a + b.made, 0);
        const totalShots = zone30d.reduce((a, b) => a + b.total, 0);
        const avg30d = totalShots > 0 ? Math.round((totalMade / totalShots) * 100) : 0;

        currentAverages[id] = avg30d;

        const last15 = zoneHistory.slice(-15);
        const vals = last15.map(d => Math.round((d.made / d.total) * 100));

        document.getElementById(`val-${id}`).innerText = avg30d + "%";

        if (charts[id]) charts[id].destroy();
        const ctx = document.getElementById(`chart-${id}`).getContext('2d');
        charts[id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last15.map(d => d.date),
                datasets: [{
                    data: vals,
                    borderColor: '#ff8800',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2,
                    fill: true,
                    backgroundColor: 'rgba(255, 136, 0, 0.05)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                onHover: (event, el) => {
                    const vEl = document.getElementById(`val-${id}`);
                    if (el.length > 0) {
                        vEl.innerText = vals[el[0].index] + "%";
                        vEl.style.color = "#fff";
                    }
                },
                plugins: { legend: {display: false}, tooltip: {enabled: false} },
                scales: { x: {display: false}, y: {display: false, min: 0, max: 105} }
            }
        });
    });
}

function resetStats(id) {
    const valEl = document.getElementById(`val-${id}`);
    valEl.innerText = currentAverages[id] + "%";
    valEl.style.color = "var(--primary)";
}

// --- HERRAMIENTAS DE BACKUP ---
function exportData() {
    const blob = new Blob([JSON.stringify(sessions)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'basket_backup.json';
    a.click();
}

function importData(e) {
    const reader = new FileReader();
    reader.onload = (event) => {
        sessions = JSON.parse(event.target.result);
        localStorage.setItem('basketV_Final', JSON.stringify(sessions));
        updateAll();
    };
    reader.readAsText(e.target.files[0]);
}

function deleteSession(id) {
    if(confirm('¿Seguro que quieres borrar este registro?')) {
        sessions = sessions.filter(s => s.id !== id);
        localStorage.setItem('basketV_Final', JSON.stringify(sessions));
        updateAll();
    }
}

// Iniciar app al cargar
init();
