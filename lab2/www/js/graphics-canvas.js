
const ML = 50, MR = 16, MT = 14, MB = 30;

function setup(canvas) {
    const dpr = devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx, W, H, pw: W - ML - MR, ph: H - MT - MB };
}

function drawGrid(ctx, pw, ph) {
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
        const x = ML + i / 8 * pw;
        ctx.beginPath();
        ctx.moveTo(x, MT);
        ctx.lineTo(x, MT + ph);
        ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
        const y = MT + i / 6 * ph;
        ctx.beginPath();
        ctx.moveTo(ML, y);
        ctx.lineTo(ML + pw, y);
        ctx.stroke();
    }
}

function drawBorder(ctx, pw, ph) {
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;
    ctx.strokeRect(ML, MT, pw, ph);
}

function tickLabels(ctx, pw, ph, xMin, xMax, yMin, yMax) {
    ctx.fillStyle = "#666";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) {
        const v = xMin + i / 4 * (xMax - xMin);
        ctx.fillText(v.toFixed(2), ML + i / 4 * pw, MT + ph + 18);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
        const v = yMin + (4 - i) / 4 * (yMax - yMin);
        ctx.fillText(v.toFixed(2), ML - 5, MT + i / 4 * ph + 4);
    }
}


export function drawEquation(canvas, fFn, a, b, root) {
    const { ctx, pw, ph } = setup(canvas);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pad = (b - a) * 0.18;
    const xMin = a - pad, xMax = b + pad;
    const N = 600;
    const ys = [];
    for (let i = 0; i <= N; i++) ys.push(fFn(xMin + i * (xMax - xMin) / N));

    const finite = ys.filter(Number.isFinite);
    if (!finite.length) return;
    let yMin = Math.min(...finite), yMax = Math.max(...finite);
    const yp = (yMax - yMin) * 0.2 || 1;
    yMin -= yp;
    yMax += yp;

    const toX = v => ML + (v - xMin) / (xMax - xMin) * pw;
    const toY = v => MT + (1 - (v - yMin) / (yMax - yMin)) * ph;

    drawGrid(ctx, pw, ph);

    if (yMin < 0 && yMax > 0) {
        ctx.strokeStyle = "#bbb";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ML, toY(0));
        ctx.lineTo(ML + pw, toY(0));
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(0,0,0,0.04)";
    ctx.fillRect(toX(a), MT, toX(b) - toX(a), ph);
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(toX(a), MT);
    ctx.lineTo(toX(a), MT + ph);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX(b), MT);
    ctx.lineTo(toX(b), MT + ph);
    ctx.stroke();
    ctx.setLineDash([]);

    tickLabels(ctx, pw, ph, xMin, xMax, yMin, yMax);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= N; i++) {
        if (!Number.isFinite(ys[i])) {
            started = false;
            continue;
        }
        const px = toX(xMin + i * (xMax - xMin) / N);
        const py = toY(ys[i]);
        if (py < MT - 2 || py > MT + ph + 2) {
            started = false;
            continue;
        }
        if (!started) {
            ctx.moveTo(px, py);
            started = true;
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();

    if (root !== null && Number.isFinite(root)) {
        const rx = toX(root), ry = toY(0);
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(rx, MT);
        ctx.lineTo(rx, MT + ph);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ML, ry);
        ctx.lineTo(ML + pw, ry);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(rx, ry, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`x* ≈ ${root.toFixed(7)}`, rx + 7, ry - 6);
    }

    drawBorder(ctx, pw, ph);
}


export function drawSystem(canvas, F1, F2, solX, solY, sysId) {
    const { ctx, W, H, pw, ph } = setup(canvas);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    const range = sysId === 2 ? [-3, 3] : [-2.5, 2.5];
    const [xMin, xMax, yMin, yMax] = [...range, ...range];
    const toX = v => ML + (v - xMin) / (xMax - xMin) * pw;
    const toY = v => MT + (1 - (v - yMin) / (yMax - yMin)) * ph;

    drawGrid(ctx, pw, ph);

    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ML, toY(0));
    ctx.lineTo(ML + pw, toY(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX(0), MT);
    ctx.lineTo(toX(0), MT + ph);
    ctx.stroke();

    ctx.fillStyle = "#666";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) {
        const v = xMin + i / 4 * (xMax - xMin);
        ctx.fillText(v.toFixed(1), ML + i / 4 * pw, MT + ph + 18);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
        const v = yMin + (4 - i) / 4 * (yMax - yMin);
        ctx.fillText(v.toFixed(1), ML - 5, MT + i / 4 * ph + 4);
    }

    function drawImplicit(F, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        const NX = 600, NY = 400;
        const dx = (xMax - xMin) / NX, dy = (yMax - yMin) / NY;
        ctx.beginPath();
        let moved = false;
        for (let i = 0; i <= NX; i++) {
            const xi = xMin + i * dx;
            let prev = F(xi, yMin), prevY = yMin;
            for (let j = 1; j <= NY; j++) {
                const yj = yMin + j * dy;
                const cur = F(xi, yj);
                if (Number.isFinite(prev) && Number.isFinite(cur) && prev * cur < 0) {
                    const t = prev / (prev - cur);
                    const yc = prevY + t * dy;
                    const px = toX(xi), py = toY(yc);
                    if (!moved) {
                        ctx.moveTo(px, py);
                        moved = true;
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                prev = cur;
                prevY = yj;
            }
        }
        ctx.stroke();
    }

    drawImplicit(F1, "#000");
    drawImplicit(F2, "#888");

    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#000";
    ctx.fillText("F₁", ML + 4, MT + 16);
    ctx.fillStyle = "#888";
    ctx.fillText("F₂", ML + 24, MT + 16);

    if (solX !== null && Number.isFinite(solX) && Number.isFinite(solY)) {
        const sx = toX(solX), sy = toY(solY);
        if (sx >= ML && sx <= ML + pw && sy >= MT && sy <= MT + ph) {
            ctx.strokeStyle = "#aaa";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(sx, MT);
            ctx.lineTo(sx, MT + ph);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ML, sy);
            ctx.lineTo(ML + pw, sy);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
            ctx.fillStyle = "#000";
            ctx.fill();
            ctx.fillStyle = "#000";
            ctx.font = "11px monospace";
            ctx.textAlign = "left";
            ctx.fillText(`(${solX.toFixed(4)}, ${solY.toFixed(4)})`, sx + 7, sy - 6);
        }
    }

    drawBorder(ctx, pw, ph);
}
