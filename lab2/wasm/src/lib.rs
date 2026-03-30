use wasm_bindgen::prelude::*;


fn jf(v: f64) -> String {
    if v.is_nan()          { return "null".into(); }
    if v.is_infinite()     { return "null".into(); }
    if v.abs() > 0.0 && v.abs() < 1e-4 {
        format!("{:e}", v)
    } else {
        let s = format!("{:.15}", v);
        let s = s.trim_end_matches('0');
        let s = if s.ends_with('.') { format!("{}0", s) } else { s.to_string() };
        s
    }
}

fn jbool(b: bool) -> &'static str { if b { "true" } else { "false" } }

fn jstr(s: &str) -> String {
    format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\"").replace('\n', "\\n"))
}

fn err(msg: &str) -> String {
    format!(r#"{{"ok":false,"error":{}}}"#, jstr(msg))
}



fn f(eq: u8, x: f64) -> f64 {
    match eq {
        1 => x.powi(3) - x - 2.0,
        2 => x.sin() - x * 0.5,
        3 => x * x.exp() - 1.0,
        4 => if x > 0.0 { x.ln() + x - 2.0 } else { f64::NAN },
        5 => x.cos() - x,
        _ => f64::NAN,
    }
}

fn f2(eq: u8, x: f64) -> f64 {
    match eq {
        1 => 6.0 * x,
        2 => -x.sin(),
        3 => x.exp() * (x + 2.0),
        4 => if x > 0.0 { -1.0 / (x * x) } else { f64::NAN },
        5 => -x.cos(),
        _ => f64::NAN,
    }
}

fn phi(eq: u8, x: f64) -> f64 {
    match eq {
        1 => (x + 2.0_f64).cbrt(),
        2 => 2.0 * x.sin(),
        3 => (-x).exp(),
        4 => if x > 0.0 { 2.0 - x.ln() } else { f64::NAN },
        5 => x.cos(),
        _ => f64::NAN,
    }
}

fn dphi(eq: u8, x: f64) -> f64 {
    match eq {
        1 => 1.0 / (3.0 * (x + 2.0_f64).powf(2.0 / 3.0)),
        2 => 2.0 * x.cos(),
        3 => -(-x).exp(),
        4 => if x > 0.0 { -1.0 / x } else { f64::NAN },
        5 => -x.sin(),
        _ => f64::NAN,
    }
}


fn validate_interval(eq: u8, a: f64, b: f64, eps: f64) -> Option<String> {
    if !a.is_finite()   { return Some("a: не конечное число".into()); }
    if !b.is_finite()   { return Some("b: не конечное число".into()); }
    if !eps.is_finite() { return Some("ε: не конечное число".into()); }
    if a >= b           { return Some(format!("Нужно a < b (a={a}, b={b})")); }
    if b - a > 1e9      { return Some("Интервал слишком широкий (> 1e9)".into()); }
    if eps <= 0.0       { return Some("ε должна быть > 0".into()); }
    if eps >= 1.0       { return Some("ε должна быть < 1".into()); }
    if eps < 1e-14      { return Some("ε слишком мала (мин. 1e-14)".into()); }

    let fa = f(eq, a);
    let fb = f(eq, b);
    if !fa.is_finite() { return Some(format!("f(a) не определена при a={a} — проверьте ОДЗ")); }
    if !fb.is_finite() { return Some(format!("f(b) не определена при b={b} — проверьте ОДЗ")); }

    let n = 1000usize;
    let h = (b - a) / n as f64;
    let mut changes = 0usize;
    let mut prev = fa;
    for i in 1..=n {
        let cur = f(eq, a + i as f64 * h);
        if prev.is_finite() && cur.is_finite() && prev * cur < 0.0 { changes += 1; }
        prev = cur;
    }

    if fa * fb > 0.0 {
        return Some(if changes == 0 {
            format!("Корней нет на [{a},{b}]: f(a)≈{fa:.4}, f(b)≈{fb:.4}")
        } else {
            format!("На [{a},{b}] ~{changes} корней, f(a)·f(b)>0 — сузьте интервал")
        });
    }
    if changes > 1 {
        return Some(format!("На интервале ~{changes} корней — сузьте до одного"));
    }
    None
}

fn choose_x0(eq: u8, a: f64, b: f64) -> f64 {
    let fa = f(eq, a);
    let fa2 = f2(eq, a);
    if fa.is_finite() && fa2.is_finite() && fa * fa2 > 0.0 { a } else { b }
}

fn max_dphi(eq: u8, a: f64, b: f64) -> f64 {
    let h = (b - a) / 500.0;
    (0..=500).map(|i| dphi(eq, a + i as f64 * h).abs())
             .filter(|v| v.is_finite())
             .fold(0.0_f64, f64::max)
}


#[wasm_bindgen]
pub fn solve_chord(eq: u8, a: f64, b: f64, eps: f64) -> String {
    if let Some(e) = validate_interval(eq, a, b, eps) { return err(&e); }

    let xf = choose_x0(eq, a, b);
    let mut x = if (xf - a).abs() < 1e-14 { b } else { a };
    let ff = f(eq, xf);
    let mut steps = String::new();
    let mut n = 0usize;

    for _ in 1..=500 {
        let fx = f(eq, x);
        let denom = fx - ff;
        if denom.abs() < 1e-15 { break; }
        let xn = x - fx * (x - xf) / denom;
        if !xn.is_finite() { break; }
        let delta = (xn - x).abs();
        n += 1;
        if n > 1 { steps.push(','); }
        steps.push_str(&format!(
            r#"{{"n":{n},"x":{},"fx":{},"delta":{}}}"#,
            jf(xn), jf(f(eq, xn)), jf(delta)
        ));
        x = xn;
        if delta < eps && f(eq, x).abs() < eps { break; }
    }

    format!(
        r#"{{"ok":true,"root":{},"froot":{},"iterations":{n},"fixed_point":{},"error":null,"steps":[{steps}]}}"#,
        jf(x), jf(f(eq, x)), jf(xf)
    )
}


#[wasm_bindgen]
pub fn solve_secant(eq: u8, a: f64, b: f64, eps: f64) -> String {
    if let Some(e) = validate_interval(eq, a, b, eps) { return err(&e); }

    let x0 = choose_x0(eq, a, b);
    let x1 = if (x0 - a).abs() < 1e-14 { b } else { a };
    let (mut xp, mut xc) = (x0, x1);
    let mut steps = String::new();
    let mut n = 0usize;

    for _ in 1..=500 {
        let fxc = f(eq, xc);
        let fxp = f(eq, xp);
        let denom = fxc - fxp;
        if denom.abs() < 1e-15 { break; }
        let xn = xc - fxc * (xc - xp) / denom;
        if !xn.is_finite() { break; }
        let delta = (xn - xc).abs();
        n += 1;
        if n > 1 { steps.push(','); }
        steps.push_str(&format!(
            r#"{{"n":{n},"x":{},"fx":{},"delta":{}}}"#,
            jf(xn), jf(f(eq, xn)), jf(delta)
        ));
        xp = xc;
        xc = xn;
        if delta < eps && f(eq, xc).abs() < eps { break; }
    }

    format!(
        r#"{{"ok":true,"root":{},"froot":{},"iterations":{n},"x0":{},"x1":{},"error":null,"steps":[{steps}]}}"#,
        jf(xc), jf(f(eq, xc)), jf(x0), jf(x1)
    )
}


#[wasm_bindgen]
pub fn solve_simple_iter(eq: u8, a: f64, b: f64, eps: f64) -> String {
    if let Some(e) = validate_interval(eq, a, b, eps) { return err(&e); }

    let q = max_dphi(eq, a, b);
    let converges = q < 1.0;
    let x0 = choose_x0(eq, a, b);
    let mid = (a + b) * 0.5;
    let span = b - a;
    let mut x = x0;
    let mut steps = String::new();
    let mut n = 0usize;
    let mut diverged = false;

    for _ in 1..=500 {
        let xn = phi(eq, x);
        if !xn.is_finite() || (xn - mid).abs() > 100.0 * span {
            diverged = true; break;
        }
        let delta = (xn - x).abs();
        n += 1;
        if n > 1 { steps.push(','); }
        steps.push_str(&format!(
            r#"{{"n":{n},"x":{},"fx":{},"delta":{}}}"#,
            jf(xn), jf(f(eq, xn)), jf(delta)
        ));
        x = xn;
        if delta < eps && f(eq, x).abs() < eps { break; }
    }

    let warn = if diverged {
        jstr("Итерации разошлись")
    } else if !converges {
        jstr(&format!("Условие сходимости нарушено: max|φ'|={q:.5} ≥ 1"))
    } else {
        "null".into()
    };

    format!(
        r#"{{"ok":true,"root":{},"froot":{},"iterations":{n},"x0":{},"converges":{},"max_dphi":{},"warning":{warn},"error":null,"steps":[{steps}]}}"#,
        jf(x), jf(f(eq, x)), jf(x0), jbool(converges), jf(q)
    )
}


fn sys_phi(sys: u8, x: f64, y: f64, xsign: f64) -> (f64, f64) {
    match sys {
        1 => ((2.0 - y.cos()) / 2.0,  (x + 1.0).sin() - 1.2),
        2 => {
            let r2 = 4.0 - y * y;
            if r2 < 0.0 { return (f64::NAN, f64::NAN); }
            let xn = xsign * r2.sqrt();
            (xn, xn - 1.0)
        },
        3 => {
            if y <= -2.0 || x >= 2.0 { return (f64::NAN, f64::NAN); }
            ((y + 2.0).ln(), (2.0 - x).ln())
        },
        _ => (f64::NAN, f64::NAN),
    }
}

fn sys_residuals(sys: u8, x: f64, y: f64) -> (f64, f64) {
    match sys {
        1 => ((x + 1.0).sin() - y - 1.2,  2.0 * x + y.cos() - 2.0),
        2 => (x * x + y * y - 4.0,         x - y - 1.0),
        3 => (x.exp() - y - 2.0,           x + y.exp() - 2.0),
        _ => (f64::NAN, f64::NAN),
    }
}

fn sys_jnorm(sys: u8, x: f64, y: f64, xsign: f64) -> f64 {
    let h = 1e-6;
    let (p1, p2) = sys_phi(sys, x, y, xsign);
    if !p1.is_finite() { return f64::NAN; }
    let (q1x, q2x) = sys_phi(sys, x + h, y, xsign);
    let (q1y, q2y) = sys_phi(sys, x, y + h, xsign);
    let row1 = (q1x - p1).abs() / h + (q1y - p1).abs() / h;
    let row2 = (q2x - p2).abs() / h + (q2y - p2).abs() / h;
    row1.max(row2)
}

#[wasm_bindgen]
pub fn solve_system(sys: u8, x0: f64, y0: f64, eps: f64) -> String {
    if sys == 0 || sys > 3 { return err("Номер системы: 1, 2 или 3"); }
    if !x0.is_finite()     { return err("x₀: не конечное число"); }
    if !y0.is_finite()     { return err("y₀: не конечное число"); }
    if x0.abs() > 1e8      { return err("x₀ слишком велико по модулю"); }
    if y0.abs() > 1e8      { return err("y₀ слишком велико по модулю"); }
    if !eps.is_finite() || eps <= 0.0 || eps >= 1.0 { return err("ε ∈ (0, 1)"); }
    if eps < 1e-14         { return err("ε слишком мала (мин. 1e-14)"); }
    if sys == 3 && y0 <= -2.0 { return err("Система 3: y₀ должно быть > −2"); }
    if sys == 3 && x0 >= 2.0  { return err("Система 3: x₀ должно быть < 2"); }

    let xsign = if x0 >= 0.0 { 1.0 } else { -1.0 };
    let jn = sys_jnorm(sys, x0, y0, xsign);
    let converges = jn.is_finite() && jn < 1.0;

    let (mut x, mut y) = (x0, y0);
    let mut steps = String::new();
    let mut n = 0usize;
    let mut diverged = false;

    for _ in 1..=500 {
        let (xn, yn) = sys_phi(sys, x, y, xsign);
        if !xn.is_finite() || !yn.is_finite() || xn.abs() > 1e9 || yn.abs() > 1e9 {
            diverged = true; break;
        }
        let dx = (xn - x).abs();
        let dy = (yn - y).abs();
        n += 1;
        if n > 1 { steps.push(','); }
        steps.push_str(&format!(
            r#"{{"n":{n},"x":{},"y":{},"dx":{},"dy":{}}}"#,
            jf(xn), jf(yn), jf(dx), jf(dy)
        ));
        x = xn; y = yn;
        if dx.max(dy) < eps { break; }
    }

    let (r1, r2) = sys_residuals(sys, x, y);
    let warn = if diverged {
        jstr("Итерации разошлись")
    } else if !converges {
        jstr(&format!("‖J‖∞ ≈ {:.4} ≥ 1 — сходимость не гарантирована", if jn.is_finite() { jn } else { 999.0 }))
    } else {
        "null".into()
    };

    format!(
        r#"{{"ok":true,"x":{},"y":{},"f1":{},"f2":{},"iterations":{n},"converges":{},"jnorm":{},"warning":{warn},"error":null,"steps":[{steps}]}}"#,
        jf(x), jf(y), jf(r1), jf(r2), jbool(converges),
        if jn.is_finite() { jf(jn) } else { "null".into() }
    )
}
