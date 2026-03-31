function selectIntegral(el) {
  document.querySelectorAll('.integral-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

function getIntegralEntry() {
  const selected = document.querySelector('.integral-card.selected');
  const value = selected ? selected.dataset.value : 'int11';
  return INTEGRALS_1[value] || INTEGRALS_2[value];
}

function getIntegralLabel() {
  const selected = document.querySelector('.integral-card.selected');
  return selected ? selected.textContent.trim() : '';
}

function getIntegral() {
  return getIntegralEntry().f;
}

function run(btn, runner) {
  document.querySelectorAll('.methods button').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  compute(runner);
}

function getParams() {
  const f   = getIntegral();
  const a   = parseFloat(document.getElementById('integrals_min').value);
  const b   = parseFloat(document.getElementById('integrals_max').value);
  const eps = parseFloat(document.getElementById('integrals_accuracy').value);
  return { f, a, b, eps };
}

function validateParams(a, b, eps) {
  if (document.getElementById('integrals_min').value.trim() === '')
    return 'Нижняя граница a: поле не заполнено';
  if (document.getElementById('integrals_max').value.trim() === '')
    return 'Верхняя граница b: поле не заполнено';
  if (document.getElementById('integrals_accuracy').value.trim() === '')
    return 'Точность ε: поле не заполнено';

  if (isNaN(a)) return 'Нижняя граница a: введите корректное число';
  if (isNaN(b)) return 'Верхняя граница b: введите корректное число';
  if (isNaN(eps)) return 'Точность ε: введите корректное число';

  if (!isFinite(a)) return 'Нижняя граница a: значение слишком велико';
  if (!isFinite(b)) return 'Верхняя граница b: значение слишком велико';
  if (!isFinite(eps)) return 'Точность ε: значение слишком велико';

  if (Math.abs(a) > 1e6) return `Нижняя граница a: слишком большое значение (|a| ≤ 1 000 000)`;
  if (Math.abs(b) > 1e6) return `Верхняя граница b: слишком большое значение (|b| ≤ 1 000 000)`;

  if (a === b) return `a и b равны (${a}) — интервал вырожден`;
  if (a > b)   return `Нужно a < b (сейчас a=${a}, b=${b})`;
  if (b - a < 1e-10) return 'Интервал [a, b] слишком мал (b − a < 1e-10)';
  if (b - a > 1e6)   return 'Интервал [a, b] слишком широкий (b − a > 1 000 000)';

  if (eps <= 0)    return 'Точность ε должна быть > 0';
  if (eps >= 1)    return 'Точность ε должна быть < 1 (например, 0.001)';
  if (eps < 1e-14) return 'Точность ε слишком мала — минимум 1e-14';

  const key = (document.querySelector('.integral-card.selected') || {}).dataset?.value ?? 'int11';

  if (key === 'int21') {
    if (a < 0) return 'Для ∫ 1/√x dx область определения x > 0. Нижняя граница a должна быть ≥ 0';
  }

  if (key === 'int22') {
    if (b > 1) return 'Для ∫ 1/√(1−x) dx область определения x < 1. Верхняя граница b должна быть ≤ 1';
    if (a >= 1) return 'Для ∫ 1/√(1−x) dx нижняя граница a должна быть < 1';
  }
  return null;
}


function compute(runner) {
  const { f, a, b, eps } = getParams();

  const error = validateParams(a, b, eps);
  if (error) {
    showError(error);
    return;
  }

  const entry = getIntegralEntry();

  if (entry.singularPoint !== undefined) {
    const loc = singularityLocation(entry.singularPoint, a, b);

    if (loc !== 'none') {
      const locLabel = {
        a:        `в точке a (x = ${entry.singularPoint})`,
        b:        `в точке b (x = ${entry.singularPoint})`,
        interior: `внутри отрезка (x = ${entry.singularPoint})`
      }[loc];

      if (!entry.convergesAtSingularity) {
        showOutput(
          `Интеграл не существует.\n` +
          `Обоснование: ${entry.convergenceNote}\n` +
          `Тип разрыва: ${locLabel}`
        );
        return;
      }

      const result = solveImproper(runner, f, a, b, eps, loc, entry.singularPoint);
      showOutput(
        `Значение интеграла: ${result.value}\n` +
        `Число разбиений n = ${result.n}\n` +
        `${entry.convergenceNote}\n` +
        `Тип разрыва: ${locLabel}`
      );
      return;
    }
  }

  const result = runner(f, a, b, eps);
  showOutput(
    `Значение интеграла: ${result.value}\n` +
    `Число разбиений n = ${result.n}`
  );
}

function showOutput(text) {
  const el = document.getElementById('output');
  el.style.color = '';
  el.innerText = text;
}

function showError(text) {
  const el = document.getElementById('output');
  el.style.color = 'crimson';
  el.innerText = `Ошибка: ${text}`;
}
