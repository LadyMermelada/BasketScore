let sessions = JSON.parse(localStorage.getItem('basketV_Final')) || [];
let editingId = null, selectedZone = null, charts = {}, profileChartObj = null;

const ZONAS_PRO = [
    { id: 'Triple_x5F_Izq', label: 'Triple Izq', type: '3p' },
    { id: 'Triple_x5F_Der', label: 'Triple Der', type: '3p' },
    { id: 'Triple_x5F_Frontal', label: 'Triple Frontal', type: '3p' },
    { id: 'Triple_x5F_Lateral_x5F_Izq', label: 'Triple Esquina Izq', type: '3p' },
    { id: 'Triple_x5F_Lateral_x5F_Der', label: 'Triple Esquina Der', type: '3p' },
    { id: 'Doble_x5F_Lateral_x5F_Izq', label: 'Doble Lateral Izq', type: '2p' },
    { id: 'Doble_x5F_Lateral_x5F_Der', label: 'Doble Lateral Der', type: '2p' },
    { id: 'Doble_x5F_Ala_x5F_Izq', label: 'Doble Ala Izq', type: '2p' },
    { id: 'Doble_x5F_Ala:_x5F_Der', label: 'Doble Ala Der', type: '2p' },
    { id: 'Doble_x5F_Pintura_x5F_Bajo', label: 'Pintura Baja', type: '2p' },
    { id: 'Doble_x5F_Pintura_x5F_Alto', label: 'Pintura Alta', type: '2p' },
    { id: 'TiroLibre', label: 'Tiro Libre', type: 'tl' }
];

const TU_SVG = `
<svg viewBox="0 0 500 350" style="width: 100%; height: 100%;">
  <g id="Triple_x5F_Izq" class="zona-interactiva"><path d="M183.25,275.82v74.18H0v-164.96h71.82c24.9,42.18,64.34,74.74,111.43,90.78Z"/></g>
  <g id="Triple_x5F_Der" class="zona-interactiva"><path d="M500,185.04v164.96h-183.25v-74.21c47.09-16.04,86.55-48.59,111.44-90.75h71.81Z"/></g>
  <g id="Triple_x5F_Frontal" class="zona-interactiva"><path d="M316.75,275.79v74.21h-133.5v-74.18c20.92,7.13,43.36,11,66.7,11s45.84-3.88,66.8-11.03Z"/></g>
  <g id="Doble_x5F_Pintura_x5F_Bajo" class="zona-interactiva"><rect x="183.25" width="133.5" height="110.04"/></g>
  <g id="Doble_x5F_Pintura_x5F_Alto" class="zona-interactiva"><rect x="183.25" y="110.04" width="133.5" height="110.04"/></g>
  <g id="Triple_x5F_Lateral_x5F_Der" class="zona-interactiva"><rect x="428.13" y="0" width="71.87" height="185.03"/></g>
  <g id="Doble_x5F_Lateral_x5F_Der" class="zona-interactiva"><rect x="316.75" y="0" width="111.44" height="110.04"/></g>
  <g id="Doble_x5F_Ala:_x5F_Der" class="zona-interactiva"><path d="M428.19,110.04v75c-35.94,60.87-102.25,101.72-178.06,101.78,36.8-.07,66.62-29.93,66.62-66.75v-110.03h111.44Z"/></g>
  <g id="TiroLibre" class="zona-interactiva"><path d="M316.75,220.07c0,36.86-29.89,66.75-66.75,66.75s-66.75-29.89-66.75-66.75h133.5Z"/></g>
  <g id="Triple_x5F_Lateral_x5F_Izq" class="zona-interactiva"><rect x="0" y="0" width="71.87" height="185.03"/></g>
  <g id="Doble_x5F_Lateral_x5F_Izq" class="zona-interactiva"><rect x="71.82" y="0" width="111.43" height="110.04"/></g>
  <g id="Doble_x5F_Ala_x5F_Izq" class="zona-interactiva"><path d="M249.95,286.82c-75.88,0-142.16-40.86-178.13-101.78v-75h111.43v110.03c0,36.84,29.85,66.72,66.7,66.75Z"/></g>
</svg>`;

// ==========================================
// MOCK DATA (Para simular la base de datos)
// ==========================================
const MOCK_USERS = [
    { name: "Tú (Admin)", role: "admin", p3: "42%", p2: "58%", ft: "85%" },
    { name: "Marcos G.", role: "member", p3: "38%", p2: "62%", ft: "78%" },
    { name: "Luis F.", role: "member", p3: "35%", p2: "55%", ft: "90%" }
];
const MOCK_FEED = [
    { user: "Marcos G.", text: "completó 50 tiros de 3P", pct: "40%", time: "2h" },
    { user: "Luis F.", text: "practicó Tiros Libres (100)", pct: "90%", time: "5h" },
    { user: "Tú", text: "registró una sesión en Pintura Alta", pct: "60%", time: "1d" }
];

// ==========================================
// CORE LOGIC
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    const items = document.querySelectorAll('.nav-item');
    if(tabId === 'cancha') { items[0].classList.add('active'); setTimeout(updateAll, 50); }
    if(tabId === 'club') { items[1].classList.add('active'); renderClubMocks(); }
    if(tabId === 'perfil') { items[2].classList.add('active'); setTimeout(updateProfileChart, 50); updateProfileTable(); }
}

function init() {
    const container = document.getElementById('courtContainer');
    container.innerHTML = TU_SVG;
    const svgElement = container.querySelector('svg');
    const grupos = svgElement.querySelectorAll('.zona-interactiva');

    grupos.forEach(grupo => {
        const zoneId = grupo.getAttribute('id');
        grupo.classList.add('zona-path');
        grupo.style.fill = "rgba(255,255,255,0.02)";
        grupo.onclick = () => openModal(zoneId);

        setTimeout(() => {
            const bbox = grupo.getBBox();
            const cx = bbox.x + bbox.width / 2;
            const cy = bbox.y + bbox.height / 2;
            let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", cx); text.setAttribute("y", cy);
            text.setAttribute("class", "zona-label-text");
            text.style.fontSize = "16px"; text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle"); text.setAttribute("id", "label-" + zoneId);
            grupo.appendChild(text);
        }, 50);
    });
    updateAll();
}

// ==========================================
// MODAL & CRUD
// ==========================================
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
        document.getElementById('errorMsg').style.display = 'block'; return;
    }

    const zonaInfo = ZONAS_PRO.find(z => z.id === selectedZone);
    let parentZone = "2 Puntos";
    if (zonaInfo) { if (zonaInfo.type === '3p') parentZone = "3 Puntos"; if (zonaInfo.type === 'tl') parentZone = "Tiro Libre"; }

    const data = { id: editingId || Date.now(), cellId: selectedZone, date: document.getElementById('inputDate').value, total, made, zone: parentZone, spec: zonaInfo ? zonaInfo.label : selectedZone, note: document.getElementById('inputNote').value };

    if (editingId) sessions = sessions.map(s => s.id === editingId ? data : s);
    else sessions.push(data);
    localStorage.setItem('basketV_Final', JSON.stringify(sessions));
    closeModal(); updateAll();
};

function deleteSession(id) {
    if(confirm('¿Eliminar registro?')) {
        sessions = sessions.filter(s => s.id !== id);
        localStorage.setItem('basketV_Final', JSON.stringify(sessions));
        updateAll();
    }
}

// ==========================================
// UPDATE ROUTINES
// ==========================================
function updateAll() {
    updateHeatmap();
    updateCharts();
    updateQuickLog();
    updateCareerStats();
    if(document.getElementById('tab-perfil').classList.contains('active')) updateProfileTable();
}

function updateHeatmap() {
    ZONAS_PRO.forEach(zona => {
        const el = document.getElementById(zona.id);
        const label = document.getElementById("label-" + zona.id);
        if (!el) return;
        const zSessions = sessions.filter(x => x.cellId === zona.id);
        if (zSessions.length > 0) {
            const p = Math.round((zSessions.reduce((a,b)=>a+b.made,0) / zSessions.reduce((a,b)=>a+b.total,0)) * 100);
            let alpha = 0.1 + (p / 100) * 0.8;
            let fillColor = `rgba(87, 234, 157, ${alpha})`;
            el.style.fill = fillColor;
            Array.from(el.children).forEach(child => { if(child.tagName === 'path' || child.tagName === 'rect') child.style.fill = fillColor; });
            if (label) label.textContent = p + "%";
        } else {
            el.style.fill = "rgba(255,255,255,0.02)";
            Array.from(el.children).forEach(child => { if(child.tagName === 'path' || child.tagName === 'rect') child.style.fill = "rgba(255,255,255,0.02)"; });
            if (label) label.textContent = "";
        }
    });
}

function updateCharts() {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSess = sessions.filter(s => new Date(s.date) >= thirtyDaysAgo);

    // Global Stat
    const gMade = recentSess.reduce((a,b) => a+b.made, 0);
    const gTotal = recentSess.reduce((a,b) => a+b.total, 0);
    document.getElementById('val-global').innerText = gTotal > 0 ? Math.round((gMade/gTotal)*100) + "%" : "--";

    // Individual Charts
    const zones = { "Tiro Libre": "tl", "2 Puntos": "2p", "3 Puntos": "3p" };
    Object.entries(zones).forEach(([name, id]) => {
        const zH = sessions.filter(s => s.zone === name).sort((a,b) => new Date(a.date) - new Date(b.date));
        const z30 = zH.filter(s => new Date(s.date) >= thirtyDaysAgo);
        const avg = z30.reduce((a,b)=>a+b.total,0) > 0 ? Math.round((z30.reduce((a,b)=>a+b.made,0) / z30.reduce((a,b)=>a+b.total,0)) * 100) : 0;
        document.getElementById(`val-${id}`).innerText = avg + "%";

        const canvas = document.getElementById(`chart-${id}`);
        if (!canvas || canvas.offsetParent === null) return;

        const last15 = zH.slice(-15);
        if (charts[id]) charts[id].destroy();
        charts[id] = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: { labels: last15.map(d => d.date), datasets: [{ data: last15.map(d => Math.round((d.made/d.total)*100)), borderColor: '#57ea9d', borderWidth: 2, tension: 0.3, pointRadius: 0, fill: true, backgroundColor: 'rgba(87, 234, 157, 0.1)' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display: false}, tooltip: {enabled: false} }, scales: { x: {display: false}, y: {display: false, min: 0, max: 105} } }
        });
    });
}

function updateQuickLog() {
    const body = document.getElementById('quickLogBody');
    if (!body) return;
    body.innerHTML = '';
    const last10 = [...sessions].sort((a,b) => b.id - a.id).slice(0, 10);
    last10.forEach(s => {
        const p = Math.round((s.made / s.total) * 100);
        let color = p >= 50 ? 'var(--primary)' : '#888';
        body.innerHTML += `<tr>
            <td>${s.date.slice(5)}</td>
            <td style="color:#fff; font-weight:bold">${s.spec}</td>
            <td>${s.made}/${s.total}</td>
            <td style="color:${color}; font-weight:bold">${p}%</td>
            <td>
                <button class="btn-icon" onclick="openModal('${s.cellId}', ${s.id})">⚙️</button>
                <button class="btn-icon" onclick="deleteSession(${s.id})">🗑️</button>
            </td>
        </tr>`;
    });
}

// ==========================================
// PROFILE FUNCTIONS
// ==========================================
function updateCareerStats() {
    const totalShots = sessions.reduce((a,b) => a+b.total, 0);
    const totalMade = sessions.reduce((a,b) => a+b.made, 0);
    document.getElementById('career-total').innerText = totalShots;
    document.getElementById('career-pct').innerText = totalShots > 0 ? Math.round((totalMade/totalShots)*100) + "%" : "0%";
}

function updateProfileTable() {
    const body = document.getElementById('logBody');
    const filterZone = document.getElementById('filterZone').value;
    const filterDate = document.getElementById('filterDate').value;
    if (!body) return;

    body.innerHTML = '';
    let filtered = [...sessions].sort((a,b) => b.id - a.id);

    // Aplicar Filtros
    if (filterZone !== 'all') {
        const zoneMap = { '3p': '3 Puntos', '2p': '2 Puntos', 'tl': 'Tiro Libre' };
        filtered = filtered.filter(s => s.zone === zoneMap[filterZone]);
    }
    if (filterDate) {
        filtered = filtered.filter(s => s.date === filterDate);
    }

    filtered.forEach(s => {
        const p = Math.round((s.made / s.total) * 100);
        let color = p >= 50 ? 'var(--primary)' : '#888';
        body.innerHTML += `<tr>
            <td>${s.date}</td><td style="color:#fff; font-weight:bold">${s.spec}</td>
            <td>${s.made}/${s.total}</td><td style="color:${color}; font-weight:bold">${p}%</td>
            <td style="font-size:0.6rem;">${s.note || '-'}</td>
        </tr>`;
    });
}

function updateProfileChart() {
    const canvas = document.getElementById('profile-chart');
    if (!canvas || canvas.offsetParent === null) return;

    const days = parseInt(document.getElementById('profileTimeRange').value);
    const limitDate = new Date(); limitDate.setDate(limitDate.getDate() - days);

    const validSessions = sessions.filter(s => new Date(s.date) >= limitDate).sort((a,b) => new Date(a.date) - new Date(b.date));

    if (profileChartObj) profileChartObj.destroy();
    profileChartObj = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: validSessions.map(d => d.date),
            datasets: [{ label: '% Global', data: validSessions.map(d => Math.round((d.made/d.total)*100)), borderColor: '#57ea9d', backgroundColor: 'rgba(87,234,157,0.1)', fill:true, tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}}, scales: { x:{display:false}, y:{min:0, max:105} } }
    });
}

// ==========================================
// MOCK RENDERING (Club Tab)
// ==========================================
function renderClubMocks() {
    // Leaderboard
    const lbBody = document.getElementById('leaderboardBody');
    if(lbBody) {
        lbBody.innerHTML = '';
        MOCK_USERS.forEach((u, i) => {
            lbBody.innerHTML += `<tr><td>${i+1}</td><td>${u.name}</td><td style="color:var(--primary)">${u.p3}</td><td>${u.p2}</td><td>${u.ft}</td></tr>`;
        });
    }

    // Admin List
    const adminList = document.getElementById('mockMembersList');
    if(adminList) {
        adminList.innerHTML = '';
        MOCK_USERS.forEach(u => {
            const btn = u.role === 'admin' ? '' : `<button style="background:none; border:1px solid #444; color:#fff; font-size:0.6rem; cursor:pointer;">Ascender</button>`;
            adminList.innerHTML += `<div class="member-row">
                <div>${u.name} <span class="member-role ${u.role}">${u.role.toUpperCase()}</span></div>
                ${btn}
            </div>`;
        });
    }

    // Feed
    const feed = document.getElementById('activityFeed');
    if(feed) {
        feed.innerHTML = '';
        MOCK_FEED.forEach(f => {
            feed.innerHTML += `<div class="feed-item">
                <span class="feed-time">${f.time}</span>
                <div><strong>${f.user}</strong> ${f.text} <span class="feed-highlight">(${f.pct})</span></div>
            </div>`;
        });
    }
}

function resetStats(id) { document.getElementById(`val-${id}`).innerText = (currentAverages[id] || 0) + "%"; }
function exportData() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sessions)], {type: 'application/json'})); a.download = 'backup.json'; a.click(); }
function importData(e) { const r = new FileReader(); r.onload = (ev) => { sessions = JSON.parse(ev.target.result); localStorage.setItem('basketV_Final', JSON.stringify(sessions)); updateAll(); }; r.readAsText(e.target.files[0]); }

window.onload = init;
