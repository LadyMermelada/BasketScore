let sessions = JSON.parse(localStorage.getItem('basketV_Final')) || [];
let editingId = null, selectedZone = null, charts = {}, currentAverages = {};

// Definición de las nuevas zonas profesionales
const ZONAS_PRO = [
    { id: 'rim', label: 'Bajo Aro', path: 'M 60 0 L 90 0 L 90 15 Q 75 25 60 15 Z', color: '#ff8800' },
    { id: 'paint-l', label: 'Pintura Izq', path: 'M 50 0 L 60 0 L 60 58 L 50 58 Z', color: '#ff8800' },
    { id: 'paint-r', label: 'Pintura Der', path: 'M 90 0 L 100 0 L 100 58 L 90 58 Z', color: '#ff8800' },
    { id: 'mid-l-base', label: 'Media Base Izq', path: 'M 15 0 L 50 0 L 50 35 Q 15 45 15 35 Z', color: '#ffbb00' },
    { id: 'mid-r-base', label: 'Media Base Der', path: 'M 100 0 L 135 0 L 135 35 Q 135 45 100 35 Z', color: '#ffbb00' },
    { id: 'mid-l-45', label: 'Media 45º Izq', path: 'M 15 35 Q 35 80 75 80 L 75 45 Q 50 45 50 35 Z', color: '#ffbb00' },
    { id: 'mid-r-45', label: 'Media 45º Der', path: 'M 135 35 Q 115 80 75 80 L 75 45 Q 100 45 100 35 Z', color: '#ffbb00' },
    { id: '3p-l-base', label: 'Triple Esquina Izq', path: 'M 0 0 L 15 0 L 15 35 Q 0 45 0 35 Z', color: '#ff4400' },
    { id: '3p-r-base', label: 'Triple Esquina Der', path: 'M 135 0 L 150 0 L 150 35 Q 150 45 135 35 Z', color: '#ff4400' },
    { id: '3p-l-45', label: 'Triple 45º Izq', path: 'M 0 35 Q 10 120 75 120 L 75 100 Q 15 100 15 35 Z', color: '#ff4400' },
    { id: '3p-r-45', label: 'Triple 45º Der', path: 'M 150 35 Q 140 120 75 120 L 75 100 Q 135 100 135 35 Z', color: '#ff4400' },
    { id: '3p-front', label: 'Triple Frontal', path: 'M 40 120 L 110 120 L 110 140 L 40 140 Z', color: '#ff4400' }
];

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    const items = document.querySelectorAll('.nav-item');
    if(tabId === 'cancha') { items[0].classList.add('active'); setTimeout(updateAll, 50); }
    if(tabId === 'club') items[1].classList.add('active');
    if(tabId === 'perfil') items[2].classList.add('active');
}

function init() {
    const grid = document.getElementById('gridOverlay');
    grid.innerHTML = ''; // Limpiamos la cuadrícula antigua

    // En lugar de cuadrados, creamos un SVG dinámico para las zonas
    let svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgContainer.setAttribute("viewBox", "0 0 150 140");
    svgContainer.style.width = "100%";
    svgContainer.style.height = "100%";

    ZONAS_PRO.forEach(zona => {
        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", zona.path);
        path.setAttribute("id", zona.id);
        path.setAttribute("class", "zona-path");
        path.style.fill = "rgba(255,255,255,0.05)";
        path.style.stroke = "rgba(255,255,255,0.1)";
        path.style.cursor = "pointer";

        path.onclick = () => openModal(zona.id);
        svgContainer.appendChild(path);
    });

    grid.appendChild(svgContainer);
    closeModal();
    updateAll();
}

function openModal(zoneId, sid = null) {
    selectedZone = zoneId;
    editingId = sid;
    const s = sessions.find(x => x.id === sid);
    const zonaInfo = ZONAS_PRO.find(z => z.id === zoneId) || { label: zoneId };

    document.getElementById('zoneText').innerText = zonaInfo.label.toUpperCase();
    document.getElementById('inputDate').value = s ? s.date : new Date().toISOString().split('T')[0];
    document.getElementById('inputTotal').value = s ? s.total : "";
    document.getElementById('inputMade').value = s ? s.made : "";
    document.getElementById('inputNote').value = s ? s.note || "" : "";
    document.getElementById('errorMsg').style.display = 'none';

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

    if (isNaN(total) || made > total || made < 0 || total <= 0) {
        document.getElementById('errorMsg').style.display = 'block';
        return;
    }

    const zonaInfo = ZONAS_PRO.find(z => z.id === selectedZone);
    const data = {
        id: editingId || Date.now(),
        cellId: selectedZone, // Usamos el ID de la zona ahora
        date: document.getElementById('inputDate').value,
        total, made,
        zone: selectedZone.includes('3p') ? "3 Puntos" : "2 Puntos",
        spec: zonaInfo ? zonaInfo.label : selectedZone,
        note: document.getElementById('inputNote').value
    };

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
    if (!body) return;
    body.innerHTML = '';
    [...sessions].sort((a,b) => b.id - a.id).forEach(s => {
        const p = Math.round((s.made / s.total) * 100);
        let color = p >= 70 ? '#4caf50' : (p >= 50 ? '#ffeb3b' : '#f44336');
        body.innerHTML += `<tr>
            <td>${s.date}</td>
            <td style="color:var(--primary); font-weight:bold">${s.spec}</td>
            <td>${s.made}/${s.total}</td>
            <td style="color:${color}; font-weight:bold">${p}%</td>
            <td>${s.note || '-'}</td>
            <td>
                <button style="background:none; border:none; cursor:pointer;" onclick="switchTab('perfil'); openModal('${s.cellId}', ${s.id})">⚙️</button>
            </td>
        </tr>`;
    });
}

function updateHeatmap() {
    ZONAS_PRO.forEach(zona => {
        const el = document.getElementById(zona.id);
        if (!el) return;

        // Buscar última sesión de esta zona
        const s = sessions.filter(x => x.cellId === zona.id).pop();
        if (s) {
            const p = Math.round((s.made / s.total) * 100);
            let r = p < 50 ? 255 : Math.round(510 - 5.1 * p), g = p < 50 ? Math.round(5.1 * p) : 255;
            el.style.fill = `rgba(${r}, ${g}, 0, 0.6)`;
        } else {
            el.style.fill = "rgba(255,255,255,0.05)";
        }
    });
}

function updateCharts() {
    const zones = { "Tiro Libre": "tl", "2 Puntos": "2p", "3 Puntos": "3p" };
    Object.entries(zones).forEach(([name, id]) => {
        const zH = sessions.filter(s => s.zone === name).sort((a,b) => new Date(a.date) - new Date(b.date));
        const totalMade = zH.slice(-20).reduce((a, b) => a + b.made, 0);
        const totalShots = zH.slice(-20).reduce((a, b) => a + b.total, 0);
        const avg30d = totalShots > 0 ? Math.round((totalMade / totalShots) * 100) : 0;

        currentAverages[id] = avg30d;
        document.getElementById(`val-${id}`).innerText = avg30d + "%";

        const canvas = document.getElementById(`chart-${id}`);
        if (!canvas || canvas.offsetParent === null) return;

        if (charts[id]) charts[id].destroy();
        charts[id] = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: zH.slice(-10).map(d => d.date),
                datasets: [{ data: zH.slice(-10).map(d => Math.round((d.made/d.total)*100)), borderColor: '#ff8800', borderWidth: 2, tension: 0.3, pointRadius: 0, fill: true, backgroundColor: 'rgba(255, 136, 0, 0.05)' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display: false} }, scales: { x: {display: false}, y: {display: false, min: 0, max: 105} } }
        });
    });
}

function exportData() {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sessions)], {type: 'application/json'})); a.download = 'backup.json'; a.click();
}

function importData(e) {
    const r = new FileReader(); r.onload = (ev) => { sessions = JSON.parse(ev.target.result); localStorage.setItem('basketV_Final', JSON.stringify(sessions)); updateAll(); }; r.readAsText(e.target.files[0]);
}

window.onload = init;
