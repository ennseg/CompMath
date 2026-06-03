package com.interpolation.validation;

import com.interpolation.model.FunctionGenerateRequest;
import com.interpolation.model.InterpolationRequest;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class InputValidator {

    private static final Set<String> VALID_METHODS = Set.of(
            "lagrange", "newton_divided", "newton_forward", "newton_backward", "gauss1", "gauss2", "all"
    );

    private static final Set<String> VALID_FUNCTIONS = Set.of(
            "sin", "cos", "exp", "ln", "x2", "x3"
    );

    private static final double MAX_VALUE = 1e10;
    private static final double MIN_VALUE = -1e10;

    public void validateInterpolationRequest(InterpolationRequest req) {
        if (req == null) {
            throw new ValidationException("Запрос не может быть пустым");
        }

        List<Double> x = req.getXValues();
        List<Double> y = req.getYValues();

        if (x == null || x.isEmpty()) {
            throw new ValidationException("Массив значений X пуст");
        }
        if (y == null || y.isEmpty()) {
            throw new ValidationException("Массив значений Y пуст");
        }
        if (x.size() != y.size()) {
            throw new ValidationException(
                    "Размеры массивов X и Y не совпадают: X=" + x.size() + ", Y=" + y.size()
            );
        }
        if (x.size() < 2) {
            throw new ValidationException("Необходимо минимум 2 узла интерполяции");
        }
        if (x.size() > 50) {
            throw new ValidationException("Максимально допустимое число узлов: 50");
        }

        for (int i = 0; i < x.size(); i++) {
            Double xi = x.get(i);
            Double yi = y.get(i);

            if (xi == null) {
                throw new ValidationException("Значение X[" + i + "] равно null");
            }
            if (yi == null) {
                throw new ValidationException("Значение Y[" + i + "] равно null");
            }
            if (!Double.isFinite(xi)) {
                throw new ValidationException("X[" + i + "] не является конечным числом (NaN или Infinity)");
            }
            if (!Double.isFinite(yi)) {
                throw new ValidationException("Y[" + i + "] не является конечным числом (NaN или Infinity)");
            }
            if (xi > MAX_VALUE || xi < MIN_VALUE) {
                throw new ValidationException("X[" + i + "]=" + xi + " выходит за допустимые пределы [" + MIN_VALUE + ", " + MAX_VALUE + "]");
            }
            if (yi > MAX_VALUE || yi < MIN_VALUE) {
                throw new ValidationException("Y[" + i + "]=" + yi + " выходит за допустимые пределы [" + MIN_VALUE + ", " + MAX_VALUE + "]");
            }
        }

        Set<Double> xSet = new HashSet<>(x);
        if (xSet.size() != x.size()) {
            throw new ValidationException("Значения X должны быть уникальными (обнаружены дубликаты)");
        }

        if (req.getMethod() != null && !req.getMethod().isBlank()) {
            String method = req.getMethod().trim().toLowerCase();
            if (!VALID_METHODS.contains(method)) {
                throw new ValidationException("Неизвестный метод: '" + req.getMethod() + "'. Допустимые: " + VALID_METHODS);
            }
        }

        if (req.getInterpolateAt() != null) {
            Double t = req.getInterpolateAt();
            if (!Double.isFinite(t)) {
                throw new ValidationException("Точка интерполяции не является конечным числом");
            }
            if (t > MAX_VALUE || t < MIN_VALUE) {
                throw new ValidationException("Точка интерполяции выходит за допустимые пределы");
            }
            double xMin = x.stream().mapToDouble(Double::doubleValue).min().orElse(Double.NaN);
            double xMax = x.stream().mapToDouble(Double::doubleValue).max().orElse(Double.NaN);
            if (t < xMin || t > xMax) {
            }
        }

        if (req.getMethod() != null) {
            String m = req.getMethod().toLowerCase();
            if (m.equals("newton_forward") || m.equals("newton_backward") || m.equals("gauss1") || m.equals("gauss2")) {
                validateEquidistant(x, m);
            }
        }
    }

    public void validateEquidistant(List<Double> x, String methodName) {
        if (x.size() < 2) return;
        List<Double> sorted = x.stream().sorted().toList();
        double h = sorted.get(1) - sorted.get(0);
        if (Math.abs(h) < 1e-12) {
            throw new ValidationException("Шаг между узлами слишком мал для метода " + methodName);
        }
        for (int i = 2; i < sorted.size(); i++) {
            double hi = sorted.get(i) - sorted.get(i - 1);
            if (Math.abs(hi - h) / Math.max(1.0, Math.abs(h)) > 1e-6) {
                throw new ValidationException(
                        "Метод '" + methodName + "' требует равноотстоящих узлов. " +
                        "Ожидаемый шаг h=" + String.format("%.6f", h) +
                        ", фактический между x[" + (i-1) + "] и x[" + i + "]: h=" + String.format("%.6f", hi)
                );
            }
        }
    }

    public void validateFunctionRequest(FunctionGenerateRequest req) {
        if (req == null) {
            throw new ValidationException("Запрос генерации функции пуст");
        }
        if (req.getFunctionName() == null || req.getFunctionName().isBlank()) {
            throw new ValidationException("Имя функции не указано");
        }
        if (!VALID_FUNCTIONS.contains(req.getFunctionName().toLowerCase())) {
            throw new ValidationException("Неизвестная функция: '" + req.getFunctionName() + "'. Допустимые: " + VALID_FUNCTIONS);
        }
        if (req.getStart() == null || req.getEnd() == null) {
            throw new ValidationException("Границы интервала не указаны");
        }
        if (!Double.isFinite(req.getStart()) || !Double.isFinite(req.getEnd())) {
            throw new ValidationException("Границы интервала должны быть конечными числами");
        }
        if (req.getStart() >= req.getEnd()) {
            throw new ValidationException("Левая граница должна быть меньше правой: start=" + req.getStart() + " >= end=" + req.getEnd());
        }
        if (req.getEnd() - req.getStart() < 1e-10) {
            throw new ValidationException("Интервал слишком мал");
        }
        if (req.getPoints() == null) {
            throw new ValidationException("Количество точек не указано");
        }
        if (req.getPoints() < 2) {
            throw new ValidationException("Минимальное количество точек: 2");
        }
        if (req.getPoints() > 50) {
            throw new ValidationException("Максимальное количество точек: 50");
        }
        if ("ln".equals(req.getFunctionName()) && req.getStart() <= 0) {
            throw new ValidationException("Для функции ln(x) интервал должен начинаться с положительного числа (start > 0)");
        }
    }
}
