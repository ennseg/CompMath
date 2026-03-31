function left_square(f, a, b, n) {
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += f(a + i * h);
  }
  return h * sum;
}

function mid_square(f, a, b, n) {
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += f(a + (i + 0.5) * h);
  }
  return h * sum;
}

function right_square(f, a, b, n) {
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += f(a + i * h);
  }
  return h * sum;
}

function trap(f, a, b, n) {
  const h = (b - a) / n;
  let sum = (f(a) + f(b)) / 2;
  for (let i = 1; i < n; i++) {
    sum += f(a + i * h);
  }
  return h * sum;
}

function simpson(f, a, b, n) {
  if (n % 2 !== 0) n++;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    sum += f(a + i * h) * (i % 2 === 0 ? 2 : 4);
  }
  return (h / 3) * sum;
}

function rungeStop(i1, i2, p) {
  return Math.abs(i2 - i1) / (Math.pow(2, p) - 1);
}

function solveWithRunge(formula, p, f, a, b, eps) {
  const MAX_ITER = 20;
  let n = 4;
  let i1 = formula(f, a, b, n);
  for (let k = 0; k < MAX_ITER; k++) {
    const i2 = formula(f, a, b, n * 2);
    if (rungeStop(i1, i2, p) < eps) {
      return { value: i2, n: n * 2 };
    }
    n *= 2;
    i1 = i2;
  }
  return { value: i1, n };
}

function runLeft(f, a, b, eps)    { return solveWithRunge(left_square,  1, f, a, b, eps); }
function runMid(f, a, b, eps)     { return solveWithRunge(mid_square,   2, f, a, b, eps); }
function runRight(f, a, b, eps)   { return solveWithRunge(right_square, 1, f, a, b, eps); }
function runTrap(f, a, b, eps)    { return solveWithRunge(trap,         2, f, a, b, eps); }
function runSimpson(f, a, b, eps) { return solveWithRunge(simpson,      4, f, a, b, eps); }

function singularityLocation(singPoint, a, b) {
  const tol = 1e-10;
  if (Math.abs(singPoint - a) < tol) return 'a';
  if (Math.abs(singPoint - b) < tol) return 'b';
  if (singPoint > a + tol && singPoint < b - tol) return 'interior';
  return 'none';
}

function solveImproper(runner, f, a, b, eps, singLoc, singPoint) {
  const delta = Math.max(eps * eps, 1e-12);

  if (singLoc === 'a') {
    return runner(f, a + delta, b, eps);
  }

  if (singLoc === 'b') {
    return runner(f, a, b - delta, eps);
  }

  const r1 = runner(f, a, singPoint - delta, eps);
  const r2 = runner(f, singPoint + delta, b, eps);
  return { value: r1.value + r2.value, n: Math.max(r1.n, r2.n) };
}
