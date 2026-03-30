import init, {
    solve_chord,
    solve_secant,
    solve_simple_iter,
    solve_system,
} from "../wasm/nonlinear_solver.js";

import { EQUATIONS, METHODS, parseFinite, parseEps, validateEqInterval } from "./equations.js";
import { SYSTEMS, validateSysInput } from "./systems.js";
import { drawEquation, drawSystem } from "./graphics-canvas.js";
import { el, showError, clearError, renderEqResult, renderSysResult, renderEqTable, renderSysTable } from "./ui.js";


(async () => {
    try {
        await init();
        el("wasm-status").classList.add("hidden");
        initUI();
    } catch (e) {
        el("wasm-status").innerHTML =
            `<div style="color:#f55">Не удалось загрузить WASM:<br>${e.message}</div>`;
    }
})();


window.switchTab = function(id) {
    document.querySelectorAll(".tab").forEach(t =>
        t.classList.toggle("active", t.dataset.tab === id));
    document.querySelectorAll(".page").forEach(p =>
        p.classList.toggle("active", p.id === "page-" + id));
    if (id === "eq") {
        refreshEqChart();
    }
    if (id === "sys") {
        refreshSysChart();
    }
};


function getEqId() {
    return +el("eq-select").value;
}

function getMethod() {
    return el("method-select").value;
}

function refreshEqChart(root = null) {
    const id = getEqId();
    const a = parseFloat(el("eq-a").value);
    const b = parseFloat(el("eq-b").value);
    if (Number.isFinite(a) && Number.isFinite(b) && a < b) {
        drawEquation(el("eq-canvas"), EQUATIONS[id].f, a, b, root);
    }
}

window.onEqSelect = function() {
    const eq = EQUATIONS[getEqId()];
    el("eq-hint").textContent = eq.hint;
    el("eq-a").value = eq.defA;
    el("eq-b").value = eq.defB;
    el("eq-result").innerHTML = "";
    el("eq-table").innerHTML = "";
    clearError("eq-error");
    drawEquation(el("eq-canvas"), eq.f, eq.defA, eq.defB, null);
};

window.solveEq = function() {
    clearError("eq-error");
    el("eq-result").innerHTML = "";
    el("eq-table").innerHTML = "";

    let eqId, a, b, eps;
    try {
        eqId = getEqId();
        a = parseFinite(el("eq-a").value, "a");
        b = parseFinite(el("eq-b").value, "b");
        eps = parseEps(el("eq-eps").value);
        validateEqInterval(eqId, a, b);
    } catch (e) {
        showError("eq-error", e);
        return;
    }

    const method = getMethod();
    let raw;
    try {
        if (method === "chord") {
            raw = solve_chord(eqId, a, b, eps);
        } else if (method === "secant") {
            raw = solve_secant(eqId, a, b, eps);
        } else {
            raw = solve_simple_iter(eqId, a, b, eps);
        }
    } catch (e) {
        showError("eq-error", "WASM error: " + e.message);
        return;
    }

    const res = JSON.parse(raw);
    if (!res.ok) {
        showError("eq-error", res.error);
        return;
    }

    drawEquation(el("eq-canvas"), EQUATIONS[eqId].f, a, b, res.root);
    renderEqResult(res, el("eq-result"));
    renderEqTable(res.steps, el("eq-table"));
};


function getSysId() {
    return +el("sys-select").value;
}

function refreshSysChart(solX = null, solY = null) {
    const id = getSysId();
    const s = SYSTEMS[id];
    drawSystem(el("sys-canvas"), s.F1, s.F2, solX, solY, id);
}

window.onSysSelect = function() {
    const s = SYSTEMS[getSysId()];
    el("sys-hint").textContent = s.hint;
    el("sys-x0").value = s.defX;
    el("sys-y0").value = s.defY;
    el("sys-result").innerHTML = "";
    el("sys-table").innerHTML = "";
    clearError("sys-error");
    refreshSysChart();
};

window.solveSys = function() {
    clearError("sys-error");
    el("sys-result").innerHTML = "";
    el("sys-table").innerHTML = "";

    let sysId, x0, y0, eps;
    try {
        sysId = getSysId();
        x0 = parseFinite(el("sys-x0").value, "x₀");
        y0 = parseFinite(el("sys-y0").value, "y₀");
        eps = parseEps(el("sys-eps").value);
        validateSysInput(sysId, x0, y0);
    } catch (e) {
        showError("sys-error", e);
        return;
    }

    let raw;
    try {
        raw = solve_system(sysId, x0, y0, eps);
    } catch (e) {
        showError("sys-error", "WASM error: " + e.message);
        return;
    }

    const res = JSON.parse(raw);
    if (!res.ok) {
        showError("sys-error", res.error);
        return;
    }

    drawSystem(el("sys-canvas"), SYSTEMS[sysId].F1, SYSTEMS[sysId].F2, res.x, res.y, sysId);
    renderSysResult(res, el("sys-result"));
    renderSysTable(res.steps, el("sys-table"));
};


function initUI() {
    const eqSel = el("eq-select");
    eqSel.innerHTML = Object.entries(EQUATIONS)
        .map(([id, e]) => `<option value="${id}">${e.label}</option>`).join("");

    const sysSel = el("sys-select");
    sysSel.innerHTML = Object.entries(SYSTEMS)
        .map(([id, s]) => `<option value="${id}">${s.label}</option>`).join("");

    onEqSelect();
    onSysSelect();
}
