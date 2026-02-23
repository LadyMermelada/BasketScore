let sessions = JSON.parse(localStorage.getItem('basketV_Final')) || [];
let editingId = null, selectedZone = null, charts = {}, profileChartObj = null, currentAverages = {};

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

const TU_SVG = `<svg viewBox="0 0 500 350" style="width: 100%; height: 100%;">
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
// MOCK DATA (Usuarios, Rankings, Feed)
// ==========================================
const MOCK_USERS = [
    { name: "Tú", role: "admin" }, { name: "Marcos G.", role: "member" },
    { name: "Luis F.", role: "member" }, { name: "Pedro R.", role: "member" },
    { name: "Juan P.", role: "member" }, { name: "Carlos M.", role: "member" }
];
// Datos falsos para el leaderboard
const MOCK_STATS = {
    'tl': [{n:"Luis F.", v:92}, {n:"Tú", v:88}, {n:"Carlos", v:81}, {n:"Marcos", v:75}, {n:"Juan", v:70}],
    '2p': [{n:"Pedro R.", v:68}, {n:"Marcos", v:62}, {n:"Tú", v:58}, {n:"Luis", v:55}, {n:"Juan", v:50}],
    '3p': [{n:"Tú", v:42}, {n:"Carlos", v:40}, {n:"Marcos", v:38}, {n:"Juan", v:35}, {n:"Luis", v:30}],
    'sess': [{n:"Marcos", v:24}, {n:"Tú", v:18}, {n:"Pedro", v:15}, {n:"Luis", v:12}, {n:"Juan", v:8}]
};
const MOCK_FEED = [
    { user: "Marcos G.", text: "completó 50 tiros de 3P", pct: 40, time: "2h" },
    { user: "Luis F.", text: "practicó Tiros Libres (100)", pct: 92, time: "5h" },
    { user: "Carlos M.", text: "tuvo un mal día en media distancia", pct: 28, time: "8h" },
    { user: "Tú", text: "registró una sesión en Pintura Alta", pct: 60, time: "1d" }
];

// ==========================================
// CORE
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
            let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", bbox.x + bbox.width / 2); text.setAttribute("y", bbox.y + bbox.height / 2);
            text.setAttribute("class", "zona-label-text");
            text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("id", "label-" + zoneId);
            grupo.appendChild(text);
        }, 50);
    });
    updateAll();
}

function openModal(zoneId, sid = null) {
    selectedZone = zoneId; editingId = sid;
    const s = sessions.find(x => x.id === sid);
    const zInfo = ZONAS_PRO.find(z => z.id === zoneId);
    document.getElementById('zoneText').innerText = zInfo ? zInfo.label.toUpperCase() : zoneId;
    document.getElementById('inputDate').value = s ? s.date : new Date().toISOString().split('T')[0];
    document.getElementById('inputTotal').value = s ? s.total : "";
    document.getElementById('inputMade').value = s ? s.made : "";
    document.getElementById('inputNote').value = s ? s.note || "" : "";
    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; document.getElementById('overlay').style.display = 'none'; editingId = null; }

document.getElementById('saveBtn').onclick = () => {
    const total = parseInt(document.getElementById('inputTotal').value), made = parseInt(document.getElementById('inputMade').value);
    if (isNaN(total) || made > total || made < 0 || total <= 0) { document.getElementById('errorMsg').style.display = 'block'; return; }
    const zInfo = ZONAS_PRO.find(z => z.id === selectedZone);
    let pZone = "2 Puntos"; if (zInfo) { if (zInfo.type === '3p') pZone = "3 Puntos"; if (zInfo.type === 'tl') pZone = "Tiro Libre"; }
    const data = { id: editingId || Date.now(), cellId: selectedZone, date: document.getElementById('inputDate').value, total, made, zone: pZone, spec: zInfo ? zInfo.label : selectedZone, note: document.getElementById('inputNote').value };
    if (editingId) sessions = sessions.map(s => s.id === editingId ? data : s); else sessions.push(data);
    localStorage.setItem('basketV_Final', JSON.stringify(sessions));
    closeModal(); updateAll();
};
function deleteSession(id) { if(confirm('¿Eliminar registro?')) { sessions = sessions.filter(s => s.id !== id); localStorage.setItem('basketV_Final', JSON.stringify(sessions)); updateAll(); } }

function updateAll() {
    updateHeatmap(); updateCharts(); updateQuickLog(); updateCareerStats();
    if(document.getElementById('tab-perfil').classList.contains('active')) updateProfileTable();
}

function updateHeatmap() {
    ZONAS_PRO.forEach(zona => {
        const el = document.getElementById(zona.id), label = document.getElementById("label-" + zona.id);
        if (!el) return;
        const zSessions = sessions.filter(x => x.cellId === zona.id);
        if (zSessions.length > 0) {
            const p = Math.round((zSessions.reduce((a,b)=>a+b.made,0) / zSessions.reduce((a,b)=>a+b.total,0)) * 100);
            let fillColor = `rgba(87, 234, 157, ${0.1 + (p / 100) * 0.8})`;
            el.style.fill = fillColor; Array.from(el.children).forEach(c => { if(c.tagName === 'path' || c.tagName === 'rect') c.style.fill = fillColor; });
            if (label) label.textContent = p + "%";
        } else {
            el.style.fill = "rgba(255,255,255,0.02)"; Array.from(el.children).forEach(c => { if(c.tagName === 'path' || c.tagName === 'rect') c.style.fill = "rgba(255,255,255,0.02)"; });
            if (label) label.textContent = "";
        }
    });
}

function updateCharts() {
    const d30 = new Date(); d30.setDate(d30.getDate() - 30);
    const recSess = sessions.filter(s => new Date(s.date) >= d30);

    const gMade = recSess.reduce((a,b) => a+b.made, 0), gTotal = recSess.reduce((a,b) => a+b.total, 0);
    document.getElementById('val-global').innerText = gTotal > 0 ? Math.round((gMade/gTotal)*100) + "%" : "--";

    const zones = { "Tiro Libre": "tl", "2 Puntos": "2p", "3 Puntos": "3p" };
    Object.entries(zones).forEach(([name, id]) => {
        const zH = sessions.filter(s => s.zone === name).sort((a,b) => new Date(a.date) - new Date(b.date));
        const z30 = zH.filter(s => new Date(s.date) >= d30);
        const avg = z30.reduce((a,b)=>a+b.total,0) > 0 ? Math.round((z30.reduce((a,b)=>a+b.made,0) / z30.reduce((a,b)=>a+b.total,0)) * 100) : 0;

        currentAverages[id] = avg;
        document.getElementById(`val-${id}`).innerText = avg + "%";

        const canvas = document.getElementById(`chart-${id}`);
        if (!canvas || canvas.offsetParent === null) return;

        const last15 = zH.slice(-15);
        const vals = last15.map(d => Math.round((d.made/d.total)*100));

        if (charts[id]) charts[id].destroy();
        charts[id] = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: { labels: last15.map(d => d.date), datasets: [{ data: vals, borderColor: '#57ea9d', borderWidth: 2, tension: 0.3, pointRadius: 2, fill: true, backgroundColor: 'rgba(87, 234, 157, 0.1)' }] },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                onHover: (event, elements) => { // RECUPERADO: HOVER LOGIC
                    const vEl = document.getElementById(`val-${id}`);
                    const dEl = document.getElementById(`date-${id}`);
                    if (elements.length > 0) {
                        const idx = elements[0].index;
                        if(vEl) { vEl.innerText = vals[idx] + "%"; vEl.style.color = "#fff"; }
                        if(dEl) dEl.innerText = last15[idx].date;
                    }
                },
                plugins: { legend: {display: false}, tooltip: {enabled: false} }, scales: { x: {display: false}, y: {display: false, min: 0, max: 105} }
            }
        });
    });
}
function resetStats(id) {
    const vEl = document.getElementById(`val-${id}`), dEl = document.getElementById(`date-${id}`);
    if (vEl) { vEl.innerText = (currentAverages[id] || 0) + "%"; vEl.style.color = "var(--primary)"; }
    if (dEl) dEl.innerText = "";
}

function updateQuickLog() {
    const body = document.getElementById('quickLogBody');
    if (!body) return; body.innerHTML = '';
    // AHORA SOLO LAS ÚLTIMAS 5
    const last5 = [...sessions].sort((a,b) => b.id - a.id).slice(0, 5);
    last5.forEach(s => {
        const p = Math.round((s.made / s.total) * 100);
        body.innerHTML += `<tr>
            <td>${s.date.slice(5)}</td><td style="color:#fff; font-weight:bold">${s.spec}</td>
            <td>${s.made}/${s.total}</td><td style="color:${p >= 50 ? 'var(--primary)' : '#888'}; font-weight:bold">${p}%</td>
            <td><button class="btn-icon" onclick="openModal('${s.cellId}', ${s.id})">⚙️</button> <button class="btn-icon" onclick="deleteSession(${s.id})">🗑️</button></td>
        </tr>`;
    });
}

function renderClubMocks() {
    const adminList = document.getElementById('mockMembersList');
    if(adminList) {
        adminList.innerHTML = '';
        MOCK_USERS.forEach(u => {
            let btns = '';
            if (u.role === 'member') btns = `<button onclick="alert('Ascendido a Admin')">Ascender</button> <button onclick="alert('Expulsado')">Remover</button>`;
            if (u.role === 'admin' && u.name !== 'Tú') btns = `<button onclick="alert('Quitado de Admin')">Quitar Admin</button>`;
            adminList.innerHTML += `<div class="member-row">
                <div>${u.name} <span class="member-role ${u.role}">${u.role.toUpperCase()}</span></div>
                <div class="admin-actions">${btns}</div>
            </div>`;
        });
    }

    const renderCard = (id, data, format) => {
        const leaderEl = document.getElementById(`leader-${id}`), top5El = document.getElementById(`top5-${id}`);
        if(leaderEl && top5El) {
            leaderEl.innerHTML = `<span class="lb-leader-name">🥇 ${data[0].n}</span> <span class="lb-leader-val">${data[0].v}${format}</span>`;
            top5El.innerHTML = data.slice(1).map((x, i) => `<li><span>${i+2}. ${x.n}</span> <span style="color:#fff;font-weight:bold;">${x.v}${format}</span></li>`).join('');
        }
    };
    renderCard('tl', MOCK_STATS.tl, '%'); renderCard('2p', MOCK_STATS['2p'], '%');
    renderCard('3p', MOCK_STATS['3p'], '%'); renderCard('sessions', MOCK_STATS.sess, ' ses.');

    const feed = document.getElementById('activityFeed');
    if(feed) {
        feed.innerHTML = '';
        MOCK_FEED.forEach(f => {
            const emoji = f.pct >= 50 ? '🔥' : '🧊';
            feed.innerHTML += `<div class="feed-item">
                <span class="feed-time">${f.time}</span>
                <span class="feed-emoji">${emoji}</span>
                <div><strong>${f.user}</strong> ${f.text} <span class="feed-highlight">(${f.pct}%)</span></div>
            </div>`;
        });
    }
}

// ==========================================
// PROFILE FUNCTIONS
// ==========================================
function updateCareerStats() {
    const totS = sessions.reduce((a,b) => a+b.total, 0), totM = sessions.reduce((a,b) => a+b.made, 0);
    document.getElementById('career-total').innerText = totS;
    document.getElementById('career-pct').innerText = totS > 0 ? Math.round((totM/totS)*100) + "%" : "0%";
}

function updateProfileTable() {
    const body = document.getElementById('logBody'), fZ = document.getElementById('filterZone').value, fD = document.getElementById('filterDate').value;
    if (!body) return; body.innerHTML = '';
    let f = [...sessions].sort((a,b) => b.id - a.id);
    if (fZ !== 'all') f = f.filter(s => s.zone === {'3p':'3 Puntos', '2p':'2 Puntos', 'tl':'Tiro Libre'}[fZ]);
    if (fD) f = f.filter(s => s.date === fD);

    f.forEach(s => {
        const p = Math.round((s.made / s.total) * 100);
        body.innerHTML += `<tr><td>${s.date}</td><td style="color:#fff; font-weight:bold">${s.spec}</td><td>${s.made}/${s.total}</td><td style="color:${p>=50?'var(--primary)':'#888'}; font-weight:bold">${p}%</td><td style="font-size:0.6rem;">${s.note || '-'}</td></tr>`;
    });
}

function updateProfileChart() {
    const canvas = document.getElementById('profile-chart');
    if (!canvas || canvas.offsetParent === null) return;

    const days = parseInt(document.getElementById('profileTimeRange').value);
    const metric = document.getElementById('profileChartMetric').value;

    const limitDate = new Date(); limitDate.setDate(limitDate.getDate() - days);

    let validSess = sessions.filter(s => new Date(s.date) >= limitDate).sort((a,b) => new Date(a.date) - new Date(b.date));

    if(metric !== 'global') {
        const zMap = {'3p': '3 Puntos', '2p': '2 Puntos', 'tl': 'Tiro Libre'};
        validSess = validSess.filter(s => s.zone === zMap[metric]);
    }

    if (profileChartObj) profileChartObj.destroy();
    profileChartObj = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels: validSess.map(d => d.date), datasets: [{ data: validSess.map(d => Math.round((d.made/d.total)*100)), borderColor: '#57ea9d', backgroundColor: 'rgba(87,234,157,0.1)', fill:true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}}, scales: { x:{display:false}, y:{min:0, max:105} } }
    });
}

function exportData() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sessions)], {type: 'application/json'})); a.download = 'backup.json'; a.click(); }
function importData(e) { const r = new FileReader(); r.onload = (ev) => { sessions = JSON.parse(ev.target.result); localStorage.setItem('basketV_Final', JSON.stringify(sessions)); updateAll(); }; r.readAsText(e.target.files[0]); }
window.onload = init;
