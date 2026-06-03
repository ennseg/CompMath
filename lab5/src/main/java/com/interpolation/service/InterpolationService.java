package com.interpolation.service;

import com.interpolation.model.FunctionGenerateRequest;
import com.interpolation.model.InterpolationRequest;
import com.interpolation.model.InterpolationResult;
import com.interpolation.validation.InputValidator;
import com.interpolation.validation.ValidationException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InterpolationService {

    private final InputValidator validator;

    public InterpolationService(InputValidator validator) {
        this.validator = validator;
    }

    public InterpolationResult compute(InterpolationRequest req) {
        try {
            validator.validateInterpolationRequest(req);
        } catch (ValidationException e) {
            InterpolationResult r = new InterpolationResult();
            r.setSuccess(false);
            r.setError(e.getMessage());
            return r;
        }

        double[] x = req.getXValues().stream().mapToDouble(Double::doubleValue).toArray();
        double[] y = req.getYValues().stream().mapToDouble(Double::doubleValue).toArray();

        Integer[] idx = new Integer[x.length];
        for (int i = 0; i < idx.length; i++) idx[i] = i;
        Arrays.sort(idx, Comparator.comparingDouble(i -> x[i]));
        double[] xs = new double[x.length];
        double[] ys = new double[x.length];
        for (int i = 0; i < idx.length; i++) { xs[i] = x[idx[i]]; ys[i] = y[idx[i]]; }

        String method = req.getMethod() == null ? "all" : req.getMethod().toLowerCase();
        int n = xs.length;

        InterpolationResult result = new InterpolationResult();
        result.setSuccess(true);

        double[][] divided = dividedDifferences(xs, ys);
        double[][] finite  = finiteForwardDifferences(ys);

        boolean equidistant = isEquidistant(xs);

        buildDifferenceTable(result, xs, ys, divided, finite, equidistant, method);

        int graphPoints = 300;
        double xMin = xs[0], xMax = xs[n - 1];
        double padding = (xMax - xMin) * 0.05;
        List<Double> gx = new ArrayList<>();
        for (int i = 0; i <= graphPoints; i++) {
            gx.add(xMin - padding + (xMax - xMin + 2 * padding) * i / graphPoints);
        }

        List<String> methodNames = new ArrayList<>();
        List<List<Double>> graphY = new ArrayList<>();

        boolean runAll = "all".equals(method);

        if (runAll || "lagrange".equals(method)) {
            methodNames.add("Лагранж");
            graphY.add(evaluateOnRange(gx, t -> lagrange(xs, ys, t)));
        }
        if (runAll || "newton_divided".equals(method)) {
            methodNames.add("Ньютон (разд. разности)");
            graphY.add(evaluateOnRange(gx, t -> newtonDivided(xs, divided, t)));
        }
        if ((runAll || "newton_forward".equals(method)) && equidistant) {
            methodNames.add("Ньютон (вперёд)");
            graphY.add(evaluateOnRange(gx, t -> newtonForward(xs, finite, t)));
        }
        if ((runAll || "newton_backward".equals(method)) && equidistant) {
            methodNames.add("Ньютон (назад)");
            graphY.add(evaluateOnRange(gx, t -> newtonBackward(xs, finite, t)));
        }
        if ((runAll || "gauss1".equals(method)) && equidistant && n >= 3) {
            methodNames.add("Гаусс (1-я формула)");
            graphY.add(evaluateOnRange(gx, t -> gauss1(xs, ys, finite, t)));
        }
        if ((runAll || "gauss2".equals(method)) && equidistant && n >= 3) {
            methodNames.add("Гаусс (2-я формула)");
            graphY.add(evaluateOnRange(gx, t -> gauss2(xs, ys, finite, t)));
        }

        result.setGraphX(gx);
        result.setGraphY(graphY);
        result.setMethodNames(methodNames);

        if (req.getInterpolateAt() != null) {
            double t = req.getInterpolateAt();
            Map<String, Double> results = new LinkedHashMap<>();

            if (runAll || "lagrange".equals(method))
                results.put("Лагранж", round(lagrange(xs, ys, t)));
            if (runAll || "newton_divided".equals(method))
                results.put("Ньютон (разделённые разности)", round(newtonDivided(xs, divided, t)));
            if ((runAll || "newton_forward".equals(method)) && equidistant)
                results.put("Ньютон (вперёд)", round(newtonForward(xs, finite, t)));
            if ((runAll || "newton_backward".equals(method)) && equidistant)
                results.put("Ньютон (назад)", round(newtonBackward(xs, finite, t)));
            if ((runAll || "gauss1".equals(method)) && equidistant && n >= 3)
                results.put("Гаусс (1-я формула)", round(gauss1(xs, ys, finite, t)));
            if ((runAll || "gauss2".equals(method)) && equidistant && n >= 3)
                results.put("Гаусс (2-я формула)", round(gauss2(xs, ys, finite, t)));

            result.setMethodResults(results);
        }

        return result;
    }

    public InterpolationResult generateFunction(FunctionGenerateRequest req) {
        try {
            validator.validateFunctionRequest(req);
        } catch (ValidationException e) {
            InterpolationResult r = new InterpolationResult();
            r.setSuccess(false);
            r.setError(e.getMessage());
            return r;
        }

        int n = req.getPoints();
        double start = req.getStart(), end = req.getEnd();
        double h = (end - start) / (n - 1);

        List<Double> xVals = new ArrayList<>();
        List<Double> yVals = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            double xi = start + i * h;
            xVals.add(xi);
            yVals.add(evalFunction(req.getFunctionName(), xi));
        }

        InterpolationResult r = new InterpolationResult();
        r.setSuccess(true);
        r.setGraphX(xVals);
        r.setGraphY(List.of(yVals));
        r.setMethodNames(List.of(req.getFunctionName()));
        return r;
    }

    public double lagrange(double[] x, double[] y, double t) {
        int n = x.length;
        double result = 0.0;
        for (int i = 0; i < n; i++) {
            double term = y[i];
            for (int j = 0; j < n; j++) {
                if (j != i) {
                    double denom = x[i] - x[j];
                    if (Math.abs(denom) < 1e-14)
                        throw new ValidationException("Обнаружены одинаковые узлы X при вычислении многочлена Лагранжа");
                    term *= (t - x[j]) / denom;
                }
            }
            result += term;
        }
        return result;
    }

    public double[][] dividedDifferences(double[] x, double[] y) {
        int n = x.length;
        double[][] d = new double[n][n];
        for (int i = 0; i < n; i++) d[i][0] = y[i];
        for (int j = 1; j < n; j++) {
            for (int i = 0; i < n - j; i++) {
                double denom = x[i + j] - x[i];
                if (Math.abs(denom) < 1e-14)
                    throw new ValidationException("Обнаружены одинаковые узлы при вычислении разделённых разностей");
                d[i][j] = (d[i + 1][j - 1] - d[i][j - 1]) / denom;
            }
        }
        return d;
    }

    public double newtonDivided(double[] x, double[][] d, double t) {
        int n = x.length;
        double result = d[0][0];
        double product = 1.0;
        for (int i = 1; i < n; i++) {
            product *= (t - x[i - 1]);
            result += d[0][i] * product;
        }
        return result;
    }

    public double[][] finiteForwardDifferences(double[] y) {
        int n = y.length;
        double[][] delta = new double[n][n];
        for (int i = 0; i < n; i++) delta[i][0] = y[i];
        for (int j = 1; j < n; j++) {
            for (int i = 0; i < n - j; i++) {
                delta[i][j] = delta[i + 1][j - 1] - delta[i][j - 1];
            }
        }
        return delta;
    }

    public double newtonForward(double[] x, double[][] delta, double t) {
        int n = x.length;
        double h = x[1] - x[0];
        double q = (t - x[0]) / h;
        double result = delta[0][0];
        double qProduct = 1.0;
        long factorial = 1;
        for (int k = 1; k < n; k++) {
            qProduct *= (q - (k - 1));
            factorial *= k;
            result += (qProduct / factorial) * delta[0][k];
        }
        return result;
    }

    public double newtonBackward(double[] x, double[][] delta, double t) {
        int n = x.length;
        double h = x[1] - x[0];
        double q = (t - x[n - 1]) / h;
        double result = delta[n - 1][0];
        double qProduct = 1.0;
        long factorial = 1;
        for (int k = 1; k < n; k++) {
            qProduct *= (q + (k - 1));
            factorial *= k;
            result += (qProduct / factorial) * delta[n - k - 1][k];
        }
        return result;
    }

    public double gauss1(double[] x, double[] y, double[][] delta, double t) {
        int n = x.length;
        int m = n / 2;
        double h = x[1] - x[0];
        double q = (t - x[m]) / h;

        double result = delta[m][0];
        double qProd = q;
        long fact = 1;
        result += qProd / 1 * delta[m][1];
        for (int k = 1; k < (n - 1) / 2; k++) {
            fact = factorial(2 * k);
            double even = 1.0;
            for (int j = -(k - 1); j <= k; j++) even *= (q + j);
            even /= fact;
            result += even * delta[m - k][2 * k];

            if (2 * k + 1 < n) {
                fact = factorial(2 * k + 1);
                double odd = 1.0;
                for (int j = -k; j <= k; j++) odd *= (q + j);
                odd /= fact;
                result += odd * delta[m - k][2 * k + 1];
            }
        }
        if (n % 2 == 0) {
            int k = n / 2;
            fact = factorial(2 * k);
            double even = 1.0;
            for (int j = -(k - 1); j <= k; j++) even *= (q + j);
            even /= fact;
            if (m - k >= 0 && 2 * k < n)
                result += even * delta[m - k][2 * k];
        }
        return result;
    }

    public double gauss2(double[] x, double[] y, double[][] delta, double t) {
        int n = x.length;
        int m = n / 2;
        double h = x[1] - x[0];
        double q = (t - x[m]) / h;

        double result = delta[m][0];
        result += q / 1.0 * delta[m - 1][1];
        for (int k = 1; k < (n - 1) / 2; k++) {
            long fact2k = factorial(2 * k);
            double even = 1.0;
            for (int j = -(k - 1); j <= k; j++) even *= (q - j);
            even /= fact2k;
            int rowIdx = m - k;
            if (rowIdx >= 0 && 2 * k < n)
                result += even * delta[rowIdx][2 * k];

            if (2 * k + 1 < n) {
                long fact2k1 = factorial(2 * k + 1);
                double odd = 1.0;
                for (int j = -k; j <= k; j++) odd *= (q - j);
                odd /= fact2k1;
                int rowIdx2 = m - k - 1;
                if (rowIdx2 >= 0)
                    result += odd * delta[rowIdx2][2 * k + 1];
            }
        }
        return result;
    }

    private boolean isEquidistant(double[] x) {
        if (x.length < 2) return true;
        double h = x[1] - x[0];
        for (int i = 2; i < x.length; i++) {
            if (Math.abs((x[i] - x[i - 1]) - h) / Math.max(1.0, Math.abs(h)) > 1e-6) return false;
        }
        return true;
    }

    private long factorial(int n) {
        long r = 1;
        for (int i = 2; i <= n; i++) r *= i;
        return r;
    }

    private double round(double v) {
        if (!Double.isFinite(v)) return v;
        return Math.round(v * 1e10) / 1e10;
    }

    private List<Double> evaluateOnRange(List<Double> gx, java.util.function.Function<Double, Double> fn) {
        List<Double> gy = new ArrayList<>();
        for (double t : gx) {
            try {
                double v = fn.apply(t);
                gy.add(Double.isFinite(v) ? Math.round(v * 1e10) / 1e10 : null);
            } catch (Exception e) {
                gy.add(null);
            }
        }
        return gy;
    }

    private void buildDifferenceTable(InterpolationResult result, double[] x, double[] y,
                                       double[][] divided, double[][] finite,
                                       boolean equidistant, String method) {
        int n = x.length;
        List<String> headers = new ArrayList<>();
        List<List<Double>> rows = new ArrayList<>();

        boolean showDivided = "all".equals(method) || "lagrange".equals(method) || "newton_divided".equals(method);
        boolean showFinite  = equidistant && ("all".equals(method) ||
                "newton_forward".equals(method) || "newton_backward".equals(method) ||
                "gauss1".equals(method) || "gauss2".equals(method));

        if (showDivided) {
            headers.add("x");
            headers.add("y");
            for (int k = 1; k < n; k++) headers.add("Δ^" + k + "y");

            for (int i = 0; i < n; i++) {
                List<Double> row = new ArrayList<>();
                row.add(round(x[i]));
                row.add(round(y[i]));
                for (int k = 1; k < n; k++) {
                    if (i + k < n) row.add(round(divided[i][k]));
                    else row.add(null);
                }
                rows.add(row);
            }
            result.setTableHeaders(headers);
            result.setDifferenceTable(rows);
        } else if (showFinite) {
            headers.add("x");
            headers.add("y");
            for (int k = 1; k < n; k++) headers.add("Δ^" + k + "y");

            for (int i = 0; i < n; i++) {
                List<Double> row = new ArrayList<>();
                row.add(round(x[i]));
                row.add(round(y[i]));
                for (int k = 1; k < n; k++) {
                    if (i + k < n) row.add(round(finite[i][k]));
                    else row.add(null);
                }
                rows.add(row);
            }
            result.setTableHeaders(headers);
            result.setDifferenceTable(rows);
        }
    }

    private double evalFunction(String name, double x) {
        return switch (name.toLowerCase()) {
            case "sin"  -> Math.sin(x);
            case "cos"  -> Math.cos(x);
            case "exp"  -> Math.exp(x);
            case "ln"   -> Math.log(x);
            case "x2"   -> x * x;
            case "x3"   -> x * x * x;
            default -> throw new ValidationException("Неизвестная функция: " + name);
        };
    }
}
