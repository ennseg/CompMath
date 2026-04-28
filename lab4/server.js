const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

function solveLinearSystem(matrix) {
    let n = matrix.length;
    for (let i = 0; i < n; i++) {
        let max = i;
        for (let k = i + 1; k < n; k++) if (Math.abs(matrix[k][i]) > Math.abs(matrix[max][i])) max = k;
        [matrix[i], matrix[max]] = [matrix[max], matrix[i]];
        if (Math.abs(matrix[i][i]) < 1e-10) return null;
        for (let k = i + 1; k < n; k++) {
            let c = -matrix[k][i] / matrix[i][i];
            for (let j = i; j <= n; j++) matrix[k][j] = (i === j) ? 0 : matrix[k][j] + c * matrix[i][j];
        }
    }
    let res = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        res[i] = matrix[i][n] / matrix[i][i];
        for (let k = i - 1; k >= 0; k--) matrix[k][n] -= matrix[k][i] * res[i];
    }
    return res;
}

const Approximation = {
    linear: (pts) => {
        let n = pts.length;
        let sx=0, sy=0, sxx=0, sxy=0;
        pts.forEach(p => { sx += p.x; sy += p.y; sxx += p.x**2; sxy += p.x*p.y; });
        let d = sxx * n - sx * sx;
        let a = (sxy * n - sx * sy) / d, b = (sxx * sy - sx * sxy) / d;
        let avgX = sx/n, avgY = sy/n;
        let num = pts.reduce((acc, p) => acc + (p.x - avgX) * (p.y - avgY), 0);
        let den = Math.sqrt(pts.reduce((acc, p) => acc + (p.x - avgX)**2, 0) * pts.reduce((acc, p) => acc + (p.y - avgY)**2, 0));
        return { name: 'Линейная', coeffs: [a, b], f: x => a*x + b, formula: `y = ${a.toFixed(3)}x + ${b.toFixed(3)}`, pearson: num/den };
    },
    poly: (pts, deg) => {
        let n = pts.length, m = deg + 1;
        let matrix = Array.from({length: m}, () => new Array(m+1).fill(0));
        for (let i=0; i<m; i++) {
            for (let j=0; j<m; j++) matrix[i][j] = pts.reduce((acc, p) => acc + Math.pow(p.x, i+j), 0);
            matrix[i][m] = pts.reduce((acc, p) => acc + p.y * Math.pow(p.x, i), 0);
        }
        let c = solveLinearSystem(matrix);
        if (!c) return null;
        return { name: `Полином ${deg} ст.`, coeffs: c, f: x => c.reduce((a,v,i)=> a + v*Math.pow(x,i), 0), formula: c.map((v,i)=>`${v.toFixed(3)}x^${i}`).reverse().join(' + ') };
    },
    exp: (pts) => {
        if (pts.some(p => p.y <= 0)) return null;
        let res = Approximation.linear(pts.map(p => ({x: p.x, y: Math.log(p.y)})));
        let a = Math.exp(res.coeffs[1]), b = res.coeffs[0];
        return { name: 'Экспоненциальная', coeffs: [a, b], f: x => a * Math.exp(b * x), formula: `y = ${a.toFixed(3)} * e^(${b.toFixed(3)}x)` };
    },
    log: (pts) => {
        if (pts.some(p => p.x <= 0)) return null;
        let res = Approximation.linear(pts.map(p => ({x: Math.log(p.x), y: p.y})));
        return { name: 'Логарифмическая', coeffs: res.coeffs, f: x => res.coeffs[0] * Math.log(x) + res.coeffs[1], formula: `y = ${res.coeffs[0].toFixed(3)}ln(x) + ${res.coeffs[1].toFixed(3)}` };
    },
    power: (pts) => {
        if (pts.some(p => p.x <= 0 || p.y <= 0)) return null;
        let res = Approximation.linear(pts.map(p => ({x: Math.log(p.x), y: Math.log(p.y)})));
        let a = Math.exp(res.coeffs[1]), b = res.coeffs[0];
        return { name: 'Степенная', coeffs: [a, b], f: x => a * Math.pow(x, b), formula: `y = ${a.toFixed(3)} * x^${b.toFixed(3)}` };
    }
};

app.post('/calculate', (req, res) => {
    const { points } = req.body;
    const models = [
        Approximation.linear(points),
        Approximation.poly(points, 2),
        Approximation.poly(points, 3),
        Approximation.exp(points),
        Approximation.log(points),
        Approximation.power(points)
    ].filter(m => m !== null);

    const results = models.map(m => {
        let s = 0;
        const vectors = points.map(p => {
            let phi = m.f(p.x);
            let eps = phi - p.y;
            s += eps**2;
            return { xi: p.x, yi: p.y, phi, eps };
        });
        let rms = Math.sqrt(s / points.length);
        let avgY = points.reduce((a, p) => a + p.y, 0) / points.length;
        let ssTot = points.reduce((a, p) => a + (p.y - avgY)**2, 0);
        let r2 = 1 - (s / ssTot);
        return { ...m, s, rms, r2, vectors };
    });
    results.sort((a,b) => a.rms - b.rms);
    res.json({ results, best: results[0] });
});

app.listen(8084);