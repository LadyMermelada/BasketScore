let sessions = JSON.parse(localStorage.getItem('basketV_Final')) || [];
let editingId = null, selectedZone = null, charts = {}, currentAverages = {};

// GEOMETRÍA CORREGIDA v1.16.3
// - Pintura dividida en 2 (Alta/Baja)
// - Tiro libre más chato y sin superposición con alas
// - Alas medias ajustadas a los nuevos bordes
const ZONAS_PRO = [
    // --- ZONAS EXTERIORES (3 Puntos) ---
    // Se dibujan primero para quedar al fondo
    { id: '3p-l-corner', label: 'Triple Esq Izq', path: 'M 0 0 L 15 0 L 15 35 L 0 35 Z', cx: 7.5, cy: 17.5, type: '3p' },
    { id: '3p-r-corner', label: 'Triple Esq Der', path: 'M 135 0 L 150 0 L 150 35 L 135 35 Z', cx: 142.5, cy: 17.5, type: '3p' },
    { id: '3p-l-wing', label: 'Triple Ala Izq', path: 'M 0 35 L 15 35 Q 15 100 75 100 L 75 140 L 0 140 Z', cx: 25, cy: 100, type: '3p' },
    { id: '3p-r-wing', label: 'Triple Ala Der', path: 'M 150 35 L 135 35 Q 135 100 75 100 L 75 140 L 150 140 Z', cx: 125, cy: 100, type: '3p' },

    // --- ZONAS MEDIA DISTANCIA ---
    { id: 'mid-l-corner', label: 'Media Esq Izq', path: 'M 15 0 L 50 0 L 50 35 L 15 35 Z', cx: 32.5, cy: 17.5, type: '2p' },
    { id: 'mid-r-corner', label: 'Media Esq Der', path: 'M 100 0 L 135 0 L 135 35 L 100 35 Z', cx: 117.5, cy: 17.5, type: '2p' },
    // Alas ajustadas para no invadir la pintura ni el tiro libre
    { id: 'mid-l-wing', label: 'Media Ala Izq', path: 'M 15 35 L 50 35 L 50 88 Q 32 88 15 82 Z', cx: 35, cy: 60, type: '2p' },
    { id: 'mid-r-wing', label: 'Media Ala Der', path: 'M 135 35 L 100 35 L 100 88 Q 118 88 135 82 Z', cx: 115, cy: 60, type: '2p' },

    // --- ZONAS INTERIORES (Pintura y TL) ---
    // Pintura dividida horizontalmente
    { id: 'paint-top', label: 'Pintura Alta', path: 'M 50 0 L 100 0 L 100 29 L 50 29 Z', cx: 75, cy: 22, type: '2p' },
    { id: 'paint-bottom', label: 'Pintura Baja', path: 'M 50 29 L 100 29 L 100 58 L 50 58 Z', cx: 75, cy: 43.5, type: '2p' },
    // Tiro libre más chato (Q 75 80 en vez de curvas más profundas)
    { id: 'ft', label: 'Tiro Libre', path: 'M 50 58 Q 75 80 100 58 Z', cx: 75, cy: 67, type: 'tl' },
    // Aro encima de todo
    { id: 'rim', label: 'Bajo Aro', path: 'M 60 0 L 90 0 L 90 15 Q 75 25 60 15 Z', cx: 75, cy: 10, type: '2p' }
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
    const container = document.getElementById('courtContainer');
    container.innerHTML = '';

    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 150 140");
    svg.style.width = "100%";
    svg.style.height = "100%";

    ZONAS_PRO.forEach(zona => {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", zona.path);
        path.setAttribute("id", zona.id);
        path.setAttribute("class", "zona-path");
        path.style.fill = "rgba(255,255,255,0.02)";
        path.onclick = () => openModal(zona.id);

        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", zona.cx);
        text.setAttribute("y", zona.cy);
        text.setAttribute("class", "zona-label-text");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("id", "label-" + zona.id);
        text.textContent = "";

        g.appendChild(path);
        g.appendChild(text);
        svg.appendChild(g);
    });

    container.appendChild(svg);
    closeModal();
    updateAll();
}

function openModal(zoneId, sid = null) {
    selectedZone = zoneId; editingId = sid;
    const s = sessions.find(x => x.id === sid);
    const zonaInfo = ZONAS_PRO.find(z => z.id === zoneId);

    document.getElementById('zoneText').innerText = zonaInfo ? zonaInfo.label.toUpperCase() : zoneId;
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
    editingId = null;
}

document.getElementById('saveBtn').onclick = () => {
    const total = parseInt(document.getElementById('inputTotal').value);
    const made = parseInt(document.getElementById('inputMade').value);

    if (isNaN(total) || made > total || made < 0 || total <= 0) {
        document.getElementById('errorMsg').style.display = 'block';
        return;
    }

    const zonaInfo = ZONAS_PRO.find(z => z.id === selectedZone);
    let parentZone = "2 Puntos";
    if (zonaInfo) {
        if (zonaInfo.type === '3p') parentZone = "3 Puntos";
        if (zonaInfo.type === 'tl') parentZone = "Tiro Libre";
    }

    const data = {
        id: editingId || Date.now(),
        cellId: selectedZone,
        date: document.getElementById('inputDate').value,
        total, made,
        zone: parentZone,
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
    updateTable(); updateHeatmap(); updateCharts();
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
        </tr>`;
    });
}

function updateHeatmap() {
    ZONAS_PRO.forEach(zona => {
        const el = document.getElementById(zona.id);
        const label = document.getElementById("label-" + zona.id);
        if (!el) return;

        const zSessions = sessions.filter(x => x.cellId === zona.id);
        if (zSessions.length > 0) {
            const tM = zSessions.reduce((a,b) => a + b.made, 0);
            const tS = zSessions.reduce((a,b) => a + b.total, 0);
            const p = Math.round((tM / tS) * 100);

            let r = p < 50 ? 255 : Math.round(510 - 5.1 * p);
            let g = p < 50 ? Math.round(5.1 * p) : 255;

            el.style.fill = `rgba(${r}, ${g}, 0, 0.6)`;
            if (label) label.textContent = p + "%";
        } else {
            el.style.fill = "rgba(255,255,255,0.02)";
            if (label) label.textContent = "";
        }
    });
}

function updateCharts() {
    const zones = { "Tiro Libre": "tl", "2 Puntos": "2p", "3 Puntos": "3p" };
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    Object.entries(zones).forEach(([name, id]) => {
        const zH = sessions.filter(s => s.zone === name).sort((a,b) => new Date(a.date) - new Date(b.date));
        const z30 = zH.filter(s => new Date(s.date) >= thirtyDaysAgo);

        const totalMade = z30.reduce((a, b) => a + b.made, 0);
        const totalShots = z30.reduce((a, b) => a + b.total, 0);
        const avg = totalShots > 0 ? Math.round((totalMade / totalShots) * 100) : 0;

        currentAverages[id] = avg;
        const valEl = document.getElementById(`val-${id}`);
        if(valEl) valEl.innerText = avg + "%";

        const canvas = document.getElementById(`chart-${id}`);
        if (!canvas || canvas.offsetParent === null) return;

        const last15 = zH.slice(-15);
        const vals = last15.map(d => Math.round((d.made/d.total)*100));

        if (charts[id]) charts[id].destroy();
        charts[id] = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: last15.map(d => d.date),
                datasets: [{ data: vals, borderColor: '#ff8800', borderWidth: 2, tension: 0.3, pointRadius: 2, fill: true, backgroundColor: 'rgba(255, 136, 0, 0.05)' }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                onHover: (event, el) => {
                    const vEl = document.getElementById(`val-${id}`);
                    const dEl = document.getElementById(`date-${id}`);
                    if (el.length > 0) {
                        vEl.innerText = vals[el[0].index] + "%";
                        if (dEl) dEl.innerText = last15[el[0].index].date;
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
    const vEl = document.getElementById(`val-${id}`);
    const dEl = document.getElementById(`date-${id}`);
    if (vEl) { vEl.innerText = (currentAverages[id] || 0) + "%"; vEl.style.color = "var(--primary)"; }
    if (dEl) dEl.innerText = "";
}

function exportData() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sessions)], {type: 'application/json'})); a.download = 'backup.json'; a.click(); }
function importData(e) { const r = new FileReader(); r.onload = (ev) => { sessions = JSON.parse(ev.target.result); localStorage.setItem('basketV_Final', JSON.stringify(sessions)); updateAll(); }; r.readAsText(e.target.files[0]); }

window.onload = init;
