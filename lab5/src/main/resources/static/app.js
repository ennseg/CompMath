
'use strict';

let currentX = [];
let currentY = [];
let mainChart = null;
let activeTab = 'manual';

const tableBody     = document.getElementById('tableBody');
const globalError   = document.getElementById('globalError');
const resultsPanel  = document.getElementById('resultsPanel');
const computeBtn    = document.getElementById('computeBtn');
const fileInput     = document.getElementById('fileInput');
const dropZone      = document.getElementById('dropZone');

initTabs();
addRow(0, '');
addRow(1, '');
addRow(2, '');

function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      activeTab = tab.dataset.tab;
      document.getElementById('tab-' + activeTab).classList.add('active');
      clearError();
    });
  });
}

function addRow(idx, xVal, yVal) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="padding:4px 10px;color:var(--text-muted);font-size:12px">${idx + 1}</td>
    <td><input type="text" class="x-input" placeholder="x" value="${xVal ?? ''}" autocomplete="off" spellcheck="false"></td>
    <td><input type="text" class="y-input" placeholder="y" value="${yVal ?? ''}" autocomplete="off" spellcheck="false"></td>
    <td><button class="del-row" title="Удалить строку">×</button></td>`;
  const delBtn = tr.querySelector('.del-row');
  delBtn.addEventListener('click', () => {
    if (tableBody.rows.length <= 1) { showError('Должна оставаться хотя бы одна строка'); return; }
    tr.remove();
    renumberRows();
  });
  tr.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => { inp.classList.remove('input-error'); clearError(); });
  });
  tableBody.appendChild(tr);
}

function renumberRows() {
  Array.from(tableBody.rows).forEach((row, i) => {
    row.cells[0].textContent = i + 1;
  });
}

document.getElementById('addRowBtn').addEventListener('click', () => {
  addRow(tableBody.rows.length, '', '');
  tableBody.lastElementChild.querySelector('.x-input').focus();
});

document.getElementById('clearTableBtn').addEventListener('click', () => {
  tableBody.innerHTML = '';
  addRow(0, '');
  addRow(1, '');
  clearError();
});

document.getElementById('parseBulkBtn').addEventListener('click', () => {
  const text = document.getElementById('bulkInput').value.trim();
  if (!text) { showError('Поле быстрого ввода пустое'); return; }
  const result = parseBulkText(text);
  if (result.error) { showError(result.error); return; }
  tableBody.innerHTML = '';
  result.x.forEach((x, i) => addRow(i, x, result.y[i]));
  document.getElementById('bulkInput').value = '';
  clearError();
});

function parseBulkText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  if (lines.length === 0) return { error: 'Нет данных для разбора' };
  const x = [], y = [];
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(/[,;\t]+|\s+/);
    if (parts.length < 2) return { error: `Строка ${i+1}: ожидается два числа, найдено: "${lines[i]}"` };
    if (parts.length > 2) return { error: `Строка ${i+1}: слишком много значений (${parts.length}), ожидается 2` };
    const xi = parseLocalFloat(parts[0]);
    const yi = parseLocalFloat(parts[1]);
    if (isNaN(xi)) return { error: `Строка ${i+1}: "${parts[0]}" не является числом` };
    if (isNaN(yi)) return { error: `Строка ${i+1}: "${parts[1]}" не является числом` };
    x.push(xi); y.push(yi);
  }
  return { x, y };
}

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f) handleFile(f);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

async function handleFile(file) {
  const statusEl  = document.getElementById('fileStatus');
  const previewEl = document.getElementById('filePreview');
  setFileStatus(statusEl, 'Загрузка…', '');
  previewEl.classList.add('hidden');

  const form = new FormData();
  form.append('file', file);

  try {
    const res  = await fetch('/api/parse-file', { method: 'POST', body: form });
    const data = await res.json();
    if (!data.success) {
      setFileStatus(statusEl, '✗ ' + data.error, 'err');
      return;
    }
    currentX = data.x;
    currentY = data.y;
    setFileStatus(statusEl, `✓ Загружено ${data.count} точек из файла "${file.name}"`, 'ok');
    renderFilePreview(previewEl, data.x, data.y);
    clearError();
  } catch (e) {
    setFileStatus(statusEl, '✗ Ошибка сети: ' + e.message, 'err');
  }
}

function setFileStatus(el, msg, cls) {
  el.textContent = msg;
  el.className = 'file-status' + (cls ? ' ' + cls : '');
  el.classList.remove('hidden');
}

function renderFilePreview(el, x, y) {
  const maxRows = 10;
  let html = '<table><thead><tr><th>#</th><th>x</th><th>y</th></tr></thead><tbody>';
  const show = Math.min(x.length, maxRows);
  for (let i = 0; i < show; i++) {
    html += `<tr><td>${i+1}</td><td>${x[i]}</td><td>${y[i]}</td></tr>`;
  }
  if (x.length > maxRows) html += `<tr><td colspan="3" style="color:var(--text-muted);font-size:11px;padding:6px 10px">… ещё ${x.length - maxRows} строк</td></tr>`;
  html += '</tbody></table>';
  el.innerHTML = html;
  el.classList.remove('hidden');
}

document.getElementById('generateFnBtn').addEventListener('click', async () => {
  const fnStatus = document.getElementById('fnStatus');
  const req = {
    functionName: document.getElementById('fnSelect').value,
    start: parseFloat(document.getElementById('fnStart').value),
    end:   parseFloat(document.getElementById('fnEnd').value),
    points: parseInt(document.getElementById('fnPoints').value, 10)
  };

  const valErr = validateFnRequest(req);
  if (valErr) { setFileStatus(fnStatus, '✗ ' + valErr, 'err'); return; }

  setFileStatus(fnStatus, 'Генерация…', '');

  try {
    const res  = await fetch('/api/generate-function', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(req)
    });
    const data = await res.json();
    if (!data.success) { setFileStatus(fnStatus, '✗ ' + data.error, 'err'); return; }

    currentX = data.graphX;
    currentY = data.graphY[0];
    setFileStatus(fnStatus, `✓ Сгенерировано ${currentX.length} точек для ${req.functionName}(x)`, 'ok');

    tableBody.innerHTML = '';
    currentX.forEach((x, i) => addRow(i, formatNum(x), formatNum(currentY[i])));

    document.querySelector('[data-tab="manual"]').click();
    clearError();
  } catch (e) {
    setFileStatus(fnStatus, '✗ ' + e.message, 'err');
  }
});

function validateFnRequest(req) {
  if (isNaN(req.start)) return 'Начало интервала не является числом';
  if (isNaN(req.end))   return 'Конец интервала не является числом';
  if (isNaN(req.points)) return 'Количество точек не является числом';
  if (!isFinite(req.start) || !isFinite(req.end)) return 'Границы интервала должны быть конечными числами';
  if (req.start >= req.end) return `Начало интервала (${req.start}) должно быть меньше конца (${req.end})`;
  if (req.points < 2)  return 'Минимальное количество точек: 2';
  if (req.points > 50) return 'Максимальное количество точек: 50';
  if (req.functionName === 'ln' && req.start <= 0) return 'Для ln(x) начало интервала должно быть > 0';
  return null;
}

computeBtn.addEventListener('click', compute);

async function compute() {
  clearError();
  computeBtn.disabled = true;
  computeBtn.textContent = 'Вычисляю…';

  try {
    const payload = buildPayload();
    if (payload.error) { showError(payload.error); return; }

    const res  = await fetch('/api/interpolate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload.data)
    });
    const data = await res.json();

    if (!data.success) { showError(data.error || 'Неизвестная ошибка сервера'); return; }

    renderResults(data, payload.data);

  } catch (e) {
    showError('Ошибка сети или сервера: ' + e.message);
  } finally {
    computeBtn.disabled = false;
    computeBtn.textContent = 'Вычислить';
  }
}

function buildPayload() {
  let x, y;

  if (activeTab === 'file') {
    if (currentX.length === 0) return { error: 'Сначала загрузите файл с данными' };
    x = currentX;
    y = currentY;
  } else {
    const rows = Array.from(tableBody.rows);
    x = []; y = [];
    const errors = [];

    rows.forEach((row, i) => {
      const xRaw = row.querySelector('.x-input').value.trim();
      const yRaw = row.querySelector('.y-input').value.trim();
      if (!xRaw && !yRaw) return; // skip blank rows

      const xi = parseLocalFloat(xRaw);
      const yi = parseLocalFloat(yRaw);

      if (!xRaw) { errors.push(`Строка ${i+1}: x не заполнено`); row.querySelector('.x-input').classList.add('input-error'); return; }
      if (!yRaw) { errors.push(`Строка ${i+1}: y не заполнено`); row.querySelector('.y-input').classList.add('input-error'); return; }
      if (isNaN(xi) || !isFinite(xi)) { errors.push(`Строка ${i+1}: x="${xRaw}" — не число`); row.querySelector('.x-input').classList.add('input-error'); return; }
      if (isNaN(yi) || !isFinite(yi)) { errors.push(`Строка ${i+1}: y="${yRaw}" — не число`); row.querySelector('.y-input').classList.add('input-error'); return; }
      if (Math.abs(xi) > 1e10) { errors.push(`Строка ${i+1}: x=${xi} слишком большое (|x| ≤ 10¹⁰)`); row.querySelector('.x-input').classList.add('input-error'); return; }
      if (Math.abs(yi) > 1e10) { errors.push(`Строка ${i+1}: y=${yi} слишком большое (|y| ≤ 10¹⁰)`); row.querySelector('.y-input').classList.add('input-error'); return; }

      x.push(xi);
      y.push(yi);
    });

    if (errors.length) return { error: errors.join('\n') };
    if (x.length < 2) return { error: 'Введите минимум 2 строки данных' };

    const xSet = new Set(x);
    if (xSet.size !== x.length) return { error: 'Значения X должны быть уникальными (обнаружены дубликаты)' };
  }

  const tRaw = document.getElementById('interpPoint').value.trim();
  let interpolateAt = null;
  if (tRaw) {
    interpolateAt = parseLocalFloat(tRaw);
    if (isNaN(interpolateAt) || !isFinite(interpolateAt))
      return { error: `Точка интерполяции "${tRaw}" не является числом` };
  }

  const method = document.getElementById('methodSelect').value;

  const needsEqui = ['newton_forward','newton_backward','gauss1','gauss2'].includes(method);
  if (needsEqui && !isEquidistant(x)) {
    showWarning(`Метод "${method}" требует равноотстоящих узлов. Сервер проверит и сообщит об ошибке.`);
  }

  return {
    data: { xValues: x, yValues: y, interpolateAt, method }
  };
}

function renderResults(data, req) {
  resultsPanel.classList.remove('hidden');

  const pointSection = document.getElementById('pointResults');
  if (data.methodResults && Object.keys(data.methodResults).length) {
    pointSection.classList.remove('hidden');
    const wrap = document.getElementById('methodResultsTable');
    const xStar = req.interpolateAt;

    const xs = [...req.xValues].sort((a,b)=>a-b);
    const extra = xStar < xs[0] || xStar > xs[xs.length-1];
    let html = '';
    if (extra) {
      html += `<div class="warn-box">⚠ x*=${xStar} находится вне диапазона данных [${xs[0]}, ${xs[xs.length-1]}] — экстраполяция.</div>`;
    }
    html += '<div class="method-results-grid">';
    for (const [name, val] of Object.entries(data.methodResults)) {
      html += `<div class="method-card"><div class="method-name">${escHtml(name)}</div><div class="method-value">${formatNum(val)}</div></div>`;
    }
    html += '</div>';
    wrap.innerHTML = html;
  } else {
    pointSection.classList.add('hidden');
  }

  const diffSection = document.getElementById('diffSection');
  if (data.differenceTable && data.tableHeaders) {
    diffSection.classList.remove('hidden');
    const wrap = document.getElementById('diffTableWrap');
    let html = '<table><thead><tr>';
    data.tableHeaders.forEach(h => { html += `<th>${escHtml(h)}</th>`; });
    html += '</tr></thead><tbody>';
    data.differenceTable.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        if (cell === null || cell === undefined) {
          html += '<td class="null-cell">—</td>';
        } else {
          html += `<td>${formatNum(cell)}</td>`;
        }
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  } else {
    diffSection.classList.add('hidden');
  }

  renderChart(data, req.xValues, req.yValues);
}

const COLORS = ['#00d4aa','#4f8ef7','#f7a24f','#e05a5a','#b46ef7','#f7e24f'];

function renderChart(data, xNodes, yNodes) {
  const ctx = document.getElementById('mainChart').getContext('2d');
  if (mainChart) { mainChart.destroy(); mainChart = null; }

  const datasets = [];

  if (data.graphX && data.graphY) {
    data.graphY.forEach((gy, idx) => {
      const points = data.graphX.map((gx, i) => ({x: gx, y: gy[i]})).filter(p => p.y !== null && isFinite(p.y));
      datasets.push({
        label: data.methodNames[idx] || ('Метод ' + (idx+1)),
        data: points,
        type: 'line',
        borderColor: COLORS[idx % COLORS.length],
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        parsing: false,
        spanGaps: false
      });
    });
  }

  datasets.push({
    label: 'Узлы интерполяции',
    data: xNodes.map((x, i) => ({x, y: yNodes[i]})),
    type: 'scatter',
    backgroundColor: '#fff',
    borderColor: '#888',
    borderWidth: 1.5,
    pointRadius: 5,
    pointHoverRadius: 7,
    parsing: false
  });

  mainChart = new Chart(ctx, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: {
          labels: { color: '#7a8aab', font: { family: 'IBM Plex Sans', size: 12 }, boxWidth: 20 }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const p = ctx.raw;
              return `(${formatNum(p.x)}, ${formatNum(p.y)})`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#7a8aab', font: { family: 'JetBrains Mono', size: 11 } }
        },
        y: {
          type: 'linear',
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#7a8aab', font: { family: 'JetBrains Mono', size: 11 } }
        }
      }
    }
  });
}

function parseLocalFloat(s) {
  if (typeof s !== 'string') return NaN;
  return parseFloat(s.replace(/\s/g, '').replace(',', '.'));
}

function formatNum(v) {
  if (v === null || v === undefined) return '—';
  if (!isFinite(v)) return String(v);
  const abs = Math.abs(v);
  if (abs === 0) return '0';
  if (abs >= 0.001 && abs < 1e8) return parseFloat(v.toPrecision(8)).toString();
  return v.toPrecision(6);
}

function isEquidistant(x) {
  if (x.length < 2) return true;
  const sorted = [...x].sort((a,b)=>a-b);
  const h = sorted[1] - sorted[0];
  for (let i = 2; i < sorted.length; i++) {
    const hi = sorted[i] - sorted[i-1];
    if (Math.abs(hi - h) / Math.max(1.0, Math.abs(h)) > 1e-6) return false;
  }
  return true;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showError(msg) {
  globalError.textContent = msg;
  globalError.classList.remove('hidden');
  globalError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showWarning(msg) {
  let warn = document.getElementById('globalWarn');
  if (!warn) {
    warn = document.createElement('div');
    warn.id = 'globalWarn';
    warn.className = 'warn-box';
    globalError.parentNode.insertBefore(warn, globalError);
  }
  warn.textContent = msg;
  warn.classList.remove('hidden');
}

function clearError() {
  globalError.classList.add('hidden');
  globalError.textContent = '';
  const warn = document.getElementById('globalWarn');
  if (warn) warn.classList.add('hidden');
}
