let sessions = JSON.parse(localStorage.getItem('basketV_Final')) || [];
let editingId = null, selectedZone = null, charts = {}, currentAverages = {};

// Tu diseño desde Illustrator mapeado a nuestra lógica
const ZONAS_PRO = [
    // TRIPLES
    { id: 'Triple_x5F_Izq', label: 'Triple Izq', type: '3p' },
    { id: 'Triple_x5F_Der', label: 'Triple Der', type: '3p' },
    { id: 'Triple_x5F_Frontal', label: 'Triple Frontal', type: '3p' },
    { id: 'Triple_x5F_Lateral_x5F_Izq', label: 'Triple Esquina Izq', type: '3p' },
    { id: 'Triple_x5F_Lateral_x5F_Der', label: 'Triple Esquina Der', type: '3p' },

    // DOBLES (2 PUNTOS)
    { id: 'Doble_x5F_Lateral_x5F_Izq', label: 'Doble Lateral Izq', type: '2p' },
    { id: 'Doble_x5F_Lateral_x5F_Der', label: 'Doble Lateral Der', type: '2p' },
    { id: 'Doble_x5F_Ala_x5F_Izq', label: 'Doble Ala Izq', type: '2p' },
    { id: 'Doble_x5F_Ala:_x5F_Der', label: 'Doble Ala Der', type: '2p' }, // Nota: Tu Illustrator puso ":" aquí
    { id: 'Doble_x5F_Pintura_x5F_Bajo', label: 'Pintura Baja', type: '2p' },
    { id: 'Doble_x5F_Pintura_x5F_Alto', label: 'Pintura Alta', type: '2p' },

    // TIROS LIBRES
    { id: 'TiroLibre', label: 'Tiro Libre', type: 'tl' }
];

// Tu código SVG limpio (sin el header XML que estorba en HTML)
const TU_SVG = `
<svg viewBox="0 0 500 350" style="width: 100%; height: 100%;">
  <g id="Triple_x5F_Izq" class="zona-interactiva">
    <path d="M183.25,275.82v74.18H0v-164.96h71.82c24.9,42.18,64.34,74.74,111.43,90.78Z"/>
  </g>
  <g id="Triple_x5F_Der" class="zona-interactiva">
    <path d="M500,185.04v164.96h-183.25v-74.21c47.09-16.04,86.55-48.59,111.44-90.75h71.81Z"/>
  </g>
  <g id="Triple_x5F_Frontal" class="zona-interactiva">
    <path d="M316.75,275.79v74.21h-133.5v-74.18c20.92,7.13,43.36,11,66.7,11s45.84-3.88,66.8-11.03Z"/>
  </g>
  <g id="Doble_x5F_Pintura_x5F_Bajo" class="zona-interactiva">
    <rect x="183.25" width="133.5" height="110.04"/>
  </g>
  <g id="Doble_x5F_Pintura_x5F_Alto" class="zona-interactiva">
    <rect x="183.25" y="110.04" width="133.5" height="110.04"/>
  </g>
  <g id="Triple_x5F_Lateral_x5F_Der" class="zona-interactiva">
    <rect x="428.13" y="0" width="71.87" height="185.03"/>
  </g>
  <g id="Doble_x5F_Lateral_x5F_Der" class="zona-interactiva">
    <rect x="316.75" y="0" width="111.44" height="110.04"/>
  </g>
  <g id="Doble_x5F_Ala:_x5F_Der" class="zona-interactiva">
    <path d="M428.19,110.04v75c-35.94,60.87-102.25,101.72-178.06,101.78,36.8-.07,66.62-29.93,66.62-66.75v-110.03h111.44Z"/>
  </g>
  <g id="TiroLibre" class="zona-interactiva">
    <path d="M316.75,220.07c0,36.86-29.89,66.75-66.75,66.75s-66.75-29.89-66.75-66.75h133.5Z"/>
  </g>
  <g id="Triple_x5F_Lateral_x5F_Izq" class="zona-interactiva">
    <rect x="0" y="0" width="71.87" height="185.03"/>
  </g>
  <g id="Doble_x5F_Lateral_x5F_Izq" class="zona-interactiva">
    <rect x="71.82" y="0" width="111.43" height="110.04"/>
  </g>
  <g id="Doble_x5F_Ala_x5F_Izq" class="zona-interactiva">
    <path d="M249.95,286.82c-75.88,0-142.16-40.86-178.13-101.78v-75h111.43v110.03c0,36.84,29.85,66.72,66.7,66.75Z"/>
  </g>
</svg>
`;

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
    // Inyectamos tu SVG
    container.innerHTML = TU_SVG;

    // Obtenemos el elemento SVG real que acabamos de inyectar
    const svgElement = container.querySelector('svg');

    // Aplicar estilos y eventos a cada grupo (g) de tu diseño
    const grupos = svgElement.querySelectorAll('.zona-interactiva');

    grupos.forEach(grupo => {
        const zoneId = grupo.getAttribute('id');
        const zonaLogica = ZONAS_PRO.find(z => z.id === zoneId);

        // Estilos base (heredando lo que teníamos en CSS)
        grupo.classList.add('zona-path');
        grupo.style.fill = "rgba(255,255,255,0.02)";
        grupo.style.cursor = "pointer";

        // Evento de clic
        grupo.onclick = () => openModal(zoneId);

        // --- CÁLCULO DE CENTRO PARA EL TEXTO ---
        // Esperamos un milisegundo a que el navegador dibuje el SVG para medirlo
        setTimeout(() => {
            const bbox = grupo.getBBox();
            // Calculamos el centro exacto de la caja delimitadora de tu forma
            const cx = bbox.x + bbox.width / 2;
            const cy = bbox.y + bbox.height / 2;

            let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", cx);
            text.setAttribute("y", cy);
            text.setAttribute("class", "zona-label-text");
            // Ajustamos el tamaño del texto para este SVG que es de 500x350
            text.style.fontSize = "16px";
            text.style.fontWeight = "900";
            text.style.fill = "white";
            text.style.textShadow = "1px 1px 3px rgba(0,0,0,0.8)";
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle"); // Centra verticalmente
            text.setAttribute("id", "label-" + zoneId);
            text.style.pointerEvents = "none";
            text.textContent = "";

            grupo.appendChild(text);
        }, 50);
    });

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
    let parentZone = "2 Puntos"; // Por defecto
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

            // Pintamos el relleno del grupo (g) o de sus hijos
            el.style.fill = `rgba(${r}, ${g}, 0, 0.6)`;
            Array.from(el.children).forEach(child => {
                if(child.tagName === 'path' || child.tagName === 'rect') {
                     child.style.fill = `rgba(${r}, ${g}, 0, 0.6)`;
                }
            });

            if (label) label.textContent = p + "%";
        } else {
            el.style.fill = "rgba(255,255,255,0.02)";
            Array.from(el.children).forEach(child => {
                if(child.tagName === 'path' || child.tagName === 'rect') {
                     child.style.fill = "rgba(255,255,255,0.02)";
                }
            });
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
