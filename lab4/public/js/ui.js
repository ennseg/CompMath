
let chart, lastRes = [];
const colors = ['red', 'blue', 'green', 'orange', 'purple', 'brown'];
for(let i=0; i<8; i++) addRow();

function addRow(x='', y='') {
    const r = document.getElementById('tb').insertRow();
    r.innerHTML = `<td><input type="number" step="any" value="${x}" style="width:90%"></td>
                    <td><input type="number" step="any" value="${y}" style="width:90%"></td>`;
}

function loadF(i) {
    const r = new FileReader();
    r.onload = (e) => {
        document.getElementById('tb').innerHTML = '';
        e.target.result.trim().split('\n').forEach(l => {
            const p = l.split(/\s+/);
            if(p[0]) addRow(p[0], p[1]);
        });
    };
    r.readAsText(i.files[0]);
}

async function calc() {
    const points = Array.from(document.getElementById('tb').rows).map(r => ({
        x: parseFloat(r.cells[0].firstChild.value),
        y: parseFloat(r.cells[1].firstChild.value)
    })).filter(p => !isNaN(p.x) && !isNaN(p.y));

    const res = await fetch('/calculate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({points})
    });
    const data = await res.json();
    lastRes = data.results;
    
    document.getElementById('dlBtn').style.display = 'block';
    showRes(data);
    draw(data);
}

function showRes(data) {
    const out = document.getElementById('res');
    out.innerHTML = '<h3>Результаты</h3>';
    data.results.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = `method-box ${m.name === data.best.name ? 'best' : ''}`;
        div.innerHTML = `
            <b style="color:${colors[i]}">${m.name}</b><br>
            ${m.formula}<br>
            RMS: ${m.rms.toFixed(4)} | R²: ${m.r2.toFixed(4)}<br>
            <button onclick="showDet(${i})" style="width:auto">Подробно</button>
        `;
        out.appendChild(div);
    });
}

function showDet(idx) {
    const m = lastRes[idx];
    document.getElementById('det').style.display = 'block';
    document.getElementById('detN').innerText = m.name;
    document.getElementById('detTb').innerHTML = m.vectors.map(v => 
        `<tr><td>${v.xi}</td><td>${v.yi}</td><td>${v.phi.toFixed(4)}</td><td>${v.eps.toFixed(4)}</td></tr>`
    ).join('');
}

function draw(data) {
    if(chart) chart.destroy();
    const ds = data.results.map((m, i) => ({
        label: m.name,
        data: m.vectors.map(v => ({x: v.xi, y: v.phi})).sort((a,b)=>a.x-b.x),
        borderColor: colors[i],
        showLine: true, pointRadius: 0, fill: false
    }));
    ds.push({
        label: 'Точки',
        data: data.results[0].vectors.map(v => ({x: v.xi, y: v.yi})),
        backgroundColor: 'black', type: 'scatter'
    });
    chart = new Chart(document.getElementById('chart'), {
        type: 'line', data: { datasets: ds },
        options: { scales: { x: {type: 'linear'}, y: {type: 'linear'} } }
    });
}

function downloadReport() {
    let text = "ОТЧЕТ\n" + "=".repeat(30) + "\n\n";
    lastRes.forEach(m => {
        text += `МЕТОД: ${m.name}\n`;
        text += `Формула: ${m.formula}\n`;
        text += `Мера отклонения S: ${m.s.toFixed(6)}\n`;
        text += `СКО (RMS): ${m.rms.toFixed(6)}\n`;
        text += `R-квадрат: ${m.r2.toFixed(6)}\n`;
        text += `Векторы (Xi | Yi | Phi | Eps):\n`;
        m.vectors.forEach(v => {
            text += `  ${v.xi.toString().padEnd(8)} | ${v.yi.toString().padEnd(8)} | ${v.phi.toFixed(4).padEnd(8)} | ${v.eps.toFixed(4)}\n`;
        });
        text += "-".repeat(30) + "\n\n";
    });
    
    const blob = new Blob([text], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'report.txt';
    a.click();
}