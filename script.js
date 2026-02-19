let sessions = JSON.parse(localStorage.getItem('basketV_Final')) || [];
let editingId = null, selectedCell = null, charts = {}, currentAverages = {};

// --- NAVEGACIÓN DE TABS ---
function switchTab(tabId) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    // Desactivar todos los items de la nav
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Activar el seleccionado
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Buscar el botón de la nav correspondiente para activarlo
    const navItems = document.querySelectorAll('.nav-item');
    if(tabId === 'cancha') navItems[0].classList.add('active');
    if(tabId === 'club') navItems[1].classList.add('active');
    if(tabId === 'perfil') navItems[2].classList.add('active');

    // Si entramos a cancha, refrescar gráficas (por si hubo cambios)
    if(tabId === 'cancha') updateAll();
}

function init() {
    const grid = document.getElementById('gridOverlay');
    grid.innerHTML = '';
    closeModal();

    for (let i = 0; i < 110; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(i);
        });
        grid.appendChild(cell);
    }

    window.addEventListener('keydown', (e) => {
        if (document.getElementById('modal').style.display === 'block') {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                document.getElementById('saveBtn').click();
            }
        }
    });

    updateAll();
}

function detectRadialZone(cellId) {
    const col = cellId % 11, row = Math.floor(cellId / 11);
    const cellX = (col / 10) * 100, cellY = (row / 9) * 100;
    const hoopX = 50, hoopY = 10;
    let angleRad = Math.atan2(cellY - hoopY, cellX - hoopX);
    let angleDeg = Math.round(Math.abs(angleRad * (180 / Math.PI) - 90) / 5) * 5;
    const isTriple = (row >= 7 || col === 0 || col === 10 || ((col === 1 || col === 9) && row >= 5) || ((col === 2 || col === 8) && row >= 6));
    let parent = isTriple ? "3 Puntos" : "2 Puntos";
    let side = col < 5 ? "Izq." : (col > 5 ? "Der." : "");
    let zoneName = isTriple ?
        ((col === 0 || col === 10) && row <= 2 ? "Triple Lateral " + side : (col >= 5 && col <= 6 && row >= 7 ? "Triple Frontal" : `Triple ${angleDeg}º ${side}`))
        : (col >= 4 && col <= 6 && row >= 3 && row <= 5 ? "Tiro Libre" : `2 Puntos ${angleDeg}º ${side}`);
    return { parent, specific: zoneName.trim() };
}

function openModal(cellId, sid = null) {
    selectedCell = cellId; editingId = sid;
    const s = sessions.find(x => x.id === sid);
    const info = detectRadialZone(cellId);
    document.getElementById('zoneText').innerText = info.specific.toUpperCase();
    document.getElementById('inputDate').value = s ? s.date : new Date().toISOString().split('T')[0];
    document.getElementById('inputTotal').value = s ? s.total : "";
    document.getElementById('inputMade').value = s ? s.made : "";
    document.getElementById('inputNote').value = s ? s.note || "" : "";
    document.getElementById('modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

document.getElementById('saveBtn').onclick = () => {
    const total = parseInt(document.getElementById('inputTotal').value);
    const made = parseInt(document.getElementById('inputMade').value);
    if (isNaN(total) || made > total || made < 0 || total <= 0) return;
    const info = detectRadialZone(selectedCell);
    const data = { id: editingId || Date.now(), cellId: selectedCell, date: document.getElementById('inputDate').value, total, made, zone: info.parent, spec: info.specific, note: document.getElementById('inputNote').value };
    if (editingId) sessions = sessions.map(s => s.id === editingId ? data : s);
    else sessions.push(data);
    localStorage.setItem('basketV_Final', JSON.stringify(sessions));
    closeModal();
    updateAll();
};

function updateAll() {
    updateTable();
    updateHeatmap();
    updateCharts();
}

function updateTable() {
    const body = document.getElementById('logBody');
    body.innerHTML = '';
    [...sessions].sort((a,b) => b.id - a.id).forEach(s => {
        const p = Math.round((s.made / s.total) * 100);
        let color = p >= 70 ? '#4caf50' : (p >= 50 ? '#ffeb3b' : '#f44336');
        body.innerHTML += `<tr><td>${s.date}</td><td style="color:var(--primary); font-weight:bold">${s.spec}</td><td>${s.made}/${s.total}</td><td style="color:${color}; font-weight:bold">${p}%</td><td>${s.note || '-'}</td><td><button onclick="openModal(${s.cellId}, ${s.id})">⚙️</button> <button onclick="deleteSession(${s.id})">🗑️</button></td></tr>`;
    });
}

function updateHeatmap() {
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(c => { c.style.background = ''; c.innerHTML = ''; });
    sessions.forEach(s => {
        const p = Math.round((s.made/s.total)*100);
        const r = p < 50 ? 255 : Math.round(510 - 5.1 * p), g = p < 50 ? Math.round(5.1 * p) : 255;
        cells[s.cellId].style.backgroundColor = `rgba(${r}, ${g}, 0, 0.7)`;
        cells[s.cellId].innerHTML = `<span class="cell-label">${p}%</span>`;
    });
}

function updateCharts() {
    const zones = { "Tiro Libre": "tl", "2 Puntos": "2p", "3 Puntos": "3p" };
    Object.entries(zones).forEach(([name, id]) => {
        const zH = sessions.filter(s => s.zone === name).sort((a,b) => new Date(a.date) - new Date(b.date));
        const totalMade = zH.slice(-20).reduce((a, b) => a + b.made, 0), totalShots = zH.slice(-20).reduce((a, b) => a + b.total, 0);
        currentAverages[id] = totalShots > 0 ? Math.round((totalMade / totalShots) * 100) : 0;
        document.getElementById(`val-${id}`).innerText = currentAverages[id] + "%";
        const vals = zH.slice(-10).map(d => Math.round((d.made / d.total) * 100));
        if (charts[id]) charts[id].destroy();
        charts[id] = new Chart(document.getElementById(`chart-${id}`).getContext('2d'), {
            type: 'line', data: { labels: zH.slice(-10).map(d => d.date), datasets: [{ data: vals, borderColor: '#ff8800', borderWidth: 2, tension: 0.3, pointRadius: 0, fill: true, backgroundColor: 'rgba(255, 136, 0, 0.05)' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display: false} }, scales: { x: {display: false}, y: {display: false, min: 0, max: 105} } }
        });
    });
}

function resetStats(id) { document.getElementById(`val-${id}`).innerText = currentAverages[id] + "%"; }
function exportData() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sessions)], {type: 'application/json'})); a.download = 'backup.json'; a.click(); }
function importData(e) { const r = new FileReader(); r.onload = (ev) => { sessions = JSON.parse(ev.target.result); localStorage.setItem('basketV_Final', JSON.stringify(sessions)); updateAll(); }; r.readAsText(e.target.files[0]); }
function deleteSession(id) { if(confirm('¿Borrar?')) { sessions = sessions.filter(s => s.id !== id); localStorage.setItem('basketV_Final', JSON.stringify(sessions)); updateAll(); } }

init();
