
export function el(id) {
    return document.getElementById(id);
}

export function showError(containerId, msg) {
    el(containerId).innerHTML = `<div class="alert alert-err">${msg}</div>`;
}

export function clearError(containerId) {
    el(containerId).innerHTML = "";
}

export function fmtNum(v, decimals = 9) {
    if (!Number.isFinite(v)) return "—";
    if (Math.abs(v) > 0 && Math.abs(v) < 1e-4) return v.toExponential(4);
    return v.toFixed(decimals);
}

function fmtExp(v) {
    if (v == null || !Number.isFinite(v)) return "—";
    return v.toExponential(3);
}


export function renderEqResult(res, container) {
    const hasWarn = res.warning && res.warning !== "null";
    container.innerHTML = `
    <div class="result">
      <div class="result-row">
        <div class="result-lbl">Корень x*</div>
        <div class="result-val">${fmtNum(res.root, 9)}</div>
      </div>
      <div class="result-row">
        <div class="result-lbl">f(x*)</div>
        <div class="result-val small">${fmtNum(res.froot)}</div>
      </div>
      <div class="result-row">
        <div class="result-lbl">Итераций</div>
        <div class="result-val">${res.iterations}</div>
      </div>
      <div class="result-row">
        <div class="result-lbl">${infoLine(res)}</div>
      </div>
      ${hasWarn
        ? `<div class="alert alert-warn">⚠ ${res.warning}</div>`
        : `<div class="alert alert-ok">✓ Условие сходимости выполнено</div>`}
    </div>`;
}

export function renderSysResult(res, container) {
    const hasWarn = res.warning && res.warning !== "null";
    container.innerHTML = `
    <div class="result">
      <div class="result-row">
        <div class="result-lbl">x₁ (решение)</div>
        <div class="result-val">${fmtNum(res.x, 9)}</div>
      </div>
      <div class="result-row">
        <div class="result-lbl">x₂ (решение)</div>
        <div class="result-val">${fmtNum(res.y, 9)}</div>
      </div>
      <div class="result-row">
        <div class="result-lbl">Невязка F₁</div>
        <div class="result-val small">${fmtNum(res.f1)}</div>
      </div>
      <div class="result-row">
        <div class="result-lbl">Невязка F₂</div>
        <div class="result-val small">${fmtNum(res.f2)}</div>
      </div>
      <div class="result-row">
        <div class="result-lbl">Итераций</div>
        <div class="result-val">${res.iterations}</div>
      </div>
      <div class="result-row">
        <div class="result-lbl">‖J‖∞ ≈ ${res.jnorm !== null ? Number(res.jnorm).toFixed(5) : "—"}</div>
      </div>
      ${hasWarn
        ? `<div class="alert alert-warn">⚠ ${res.warning}</div>`
        : `<div class="alert alert-ok">✓ Сходимость подтверждена</div>`}
    </div>`;
}

function infoLine(res) {
    if (res.fixed_point !== undefined) {
        return `Фиксированный конец: ${fmtNum(res.fixed_point, 5)}`;
    }
    if (res.x0 !== undefined) {
        return `x₀=${fmtNum(res.x0, 5)}, x₁=${fmtNum(res.x1, 5)}`;
    }
    if (res.max_dphi !== undefined) {
        return `max|φ'| = ${Number(res.max_dphi).toFixed(5)}`;
    }
    return "";
}


export function renderEqTable(steps, container) {
    if (!steps.length) {
        container.innerHTML = "";
        return;
    }
    const rows = steps.map((s, i) => {
        const last = i === steps.length - 1;
        return `<tr style="${last ? "color:#00e060" : ""}">
      <td>${s.n}</td>
      <td>${fmtNum(s.x, 9)}</td>
      <td>${fmtExp(s.fx)}</td>
      <td>${fmtExp(s.delta)}</td>
    </tr>`;
    }).join("");
    container.innerHTML = `
    <details>
      <summary>Таблица итераций (${steps.length} шагов)</summary>
      <table class="iter-table">
        <thead><tr><th>№</th><th>x</th><th>f(x)</th><th>|Δx|</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </details>`;
}

export function renderSysTable(steps, container) {
    if (!steps.length) {
        container.innerHTML = "";
        return;
    }
    const rows = steps.map((s, i) => {
        const last = i === steps.length - 1;
        return `<tr style="${last ? "color:#00e060" : ""}">
      <td>${s.n}</td>
      <td>${fmtNum(s.x, 7)}</td>
      <td>${fmtNum(s.y, 7)}</td>
      <td>${fmtExp(s.dx)}</td>
      <td>${fmtExp(s.dy)}</td>
    </tr>`;
    }).join("");
    container.innerHTML = `
    <details>
      <summary>Таблица итераций (${steps.length} шагов)</summary>
      <table class="iter-table">
        <thead><tr><th>№</th><th>x₁</th><th>x₂</th><th>|Δx₁|</th><th>|Δx₂|</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </details>`;
}
