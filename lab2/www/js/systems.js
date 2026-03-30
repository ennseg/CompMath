
export const SYSTEMS = {
    1: {
        label: "sin(x+1)−y=1.2  ;  2x+cos(y)=2",
        hint: "решение ≈ (0.5097, −0.2017)   рек. x₀=0.5, y₀=−0.2",
        F1: (x, y) => Math.sin(x + 1) - y - 1.2,
        F2: (x, y) => 2 * x + Math.cos(y) - 2,
        defX: 0.5,
        defY: -0.2,
    },
    2: {
        label: "x²+y²=4  ;  x−y=1",
        hint: "решение ≈ (1.8229, 0.8229)   рек. x₀=1.5, y₀=0.8",
        F1: (x, y) => x * x + y * y - 4,
        F2: (x, y) => x - y - 1,
        defX: 1.5,
        defY: 0.8,
    },
    3: {
        label: "eˣ−y=2  ;  x+eʸ=2",
        hint: "решение ≈ (0.7859, 0.1931)   рек. x₀=0.5, y₀=0.2   [x<2, y>−2]",
        F1: (x, y) => Math.exp(x) - y - 2,
        F2: (x, y) => x + Math.exp(y) - 2,
        defX: 0.5,
        defY: 0.2,
    },
};

export function validateSysInput(sysId, x0, y0) {
    if (Math.abs(x0) > 1e8) throw "x₀ слишком велико по модулю (не более 1e8)";
    if (Math.abs(y0) > 1e8) throw "y₀ слишком велико по модулю (не более 1e8)";
    if (sysId === 3 && y0 <= -2) throw "Для системы 3: y₀ должно быть > −2";
    if (sysId === 3 && x0 >= 2) throw "Для системы 3: x₀ должно быть < 2";
}
