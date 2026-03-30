
export const EQUATIONS = {
    1: {
        label: "x³ − x − 2 = 0",
        hint: "корень ≈ 1.5214   рек. интервал: a=1, b=2",
        f: x => x**3 - x - 2,
        defA: 1,
        defB: 2,
    },
    2: {
        label: "sin(x) − x/2 = 0",
        hint: "корень ≈ 1.8955   рек. интервал: a=1, b=2",
        f: x => Math.sin(x) - x * 0.5,
        defA: 1,
        defB: 2,
    },
    3: {
        label: "x·eˣ − 1 = 0",
        hint: "корень ≈ 0.5671   рек. интервал: a=0, b=1",
        f: x => x * Math.exp(x) - 1,
        defA: 0,
        defB: 1,
    },
    4: {
        label: "ln(x) + x − 2 = 0",
        hint: "корень ≈ 1.5571   рек. интервал: a=1, b=2   [x > 0]",
        f: x => x > 0 ? Math.log(x) + x - 2 : NaN,
        defA: 1,
        defB: 2,
    },
    5: {
        label: "cos(x) − x = 0",
        hint: "корень ≈ 0.7391   рек. интервал: a=0, b=1",
        f: x => Math.cos(x) - x,
        defA: 0,
        defB: 1,
    },
};

export const METHODS = [
    { id: "chord", label: "Метод хорд" },
    { id: "secant", label: "Метод секущих" },
    { id: "iter", label: "Метод простых итераций" },
];


export function parseFinite(raw, name) {
    const s = String(raw).trim();
    if (!s || s === "-" || s === "+") throw `${name}: введите число`;
    if (s.includes(',')) throw `${name}: используйте точку как разделитель дробной части`;
    if (/[^0-9.\-+eE]/.test(s)) throw `${name}: недопустимые символы (только цифры, точка, e, знак)`;
    const v = Number(s);
    if (Number.isNaN(v)) throw `${name}: "${s}" не является числом`;
    if (!Number.isFinite(v)) throw `${name}: слишком большое значение (переполнение)`;
    return v;
}

export function parseEps(raw) {
    const v = parseFinite(raw, "ε");
    if (v <= 0) throw "ε должна быть > 0";
    if (v >= 1) throw "ε должна быть < 1";
    if (v < 1e-14) throw "ε слишком мала (минимум 1e-14)";
    return v;
}

export function validateEqInterval(eqId, a, b) {
    if (a >= b) throw `Нужно a < b  (a=${a}, b=${b})`;
    if (b - a > 1e9) throw "Интервал слишком широкий (не более 1e9)";

    const eq = EQUATIONS[eqId];
    const fa = eq.f(a), fb = eq.f(b);
    if (!Number.isFinite(fa)) throw `f(a) не определена при a=${a} — проверьте ОДЗ`;
    if (!Number.isFinite(fb)) throw `f(b) не определена при b=${b} — проверьте ОДЗ`;

    let changes = 0, prev = fa;
    const h = (b - a) / 1000;
    for (let i = 1; i <= 1000; i++) {
        const cur = eq.f(a + i * h);
        if (Number.isFinite(cur) && Number.isFinite(prev) && prev * cur < 0) changes++;
        prev = cur;
    }

    if (fa * fb > 0) {
        throw changes === 0
            ? `Корней нет на [${a}, ${b}]: f(a)≈${fa.toFixed(4)}, f(b)≈${fb.toFixed(4)}`
            : `На [${a},${b}] ~${changes} корней, f(a)·f(b)>0 — сузьте интервал`;
    }
    if (changes > 1) throw `На интервале ~${changes} корней — сузьте до одного`;
}
