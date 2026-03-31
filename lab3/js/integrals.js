const INTEGRALS_1 = {
  int11: { f: x => Math.exp(-x * x) },
  int12: { f: x => Math.abs(x) < 1e-14 ? 1 : Math.sin(x) / x },
  int13: { f: x => Math.sqrt(1 + Math.sin(x) ** 2) }
};


const INTEGRALS_2 = {
  int21: {
    label: '∫ 1/√x dx  [разрыв в a]',
    f: x => 1 / Math.sqrt(x),
    singularPoint: 0,
    convergesAtSingularity: true,
    convergenceNote: 'Случай 1 (разрыв в a). Сходится: α = 1/2 < 1. Точное значение при [0,1]: 2'
  },

  int22: {
    label: '∫ 1/√(1−x) dx  [разрыв в b]',
    f: x => 1 / Math.sqrt(1 - x),
    singularPoint: 1,
    convergesAtSingularity: true,
    convergenceNote: 'Случай 2 (разрыв в b). Сходится: α = 1/2 < 1. Точное значение при [0,1]: 2'
  },

  int23: {
    label: '∫ 1/√|x| dx  [разрыв внутри]',
    f: x => 1 / Math.sqrt(Math.abs(x)),
    singularPoint: 0,
    convergesAtSingularity: true,
    convergenceNote: 'Случай 3 (разрыв внутри). Сходится: α = 1/2 < 1 с обеих сторон. Точное значение при [−1,1]: 4'
  },

  int24: {
    label: '∫ 1/x dx  [расходится]',
    f: x => 1 / x,
    singularPoint: 0,
    convergesAtSingularity: false,
    convergenceNote: 'Расходится: α = 1 ≥ 1'
  }
};
