package com.interpolation.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class InterpolationRequest {

    @JsonProperty("xValues")
    @NotNull(message = "Массив X не может быть null")
    @Size(min = 2, max = 50, message = "Необходимо от 2 до 50 узлов интерполяции")
    private List<Double> xValues;

    @JsonProperty("yValues")
    @NotNull(message = "Массив Y не может быть null")
    @Size(min = 2, max = 50, message = "Необходимо от 2 до 50 узлов интерполяции")
    private List<Double> yValues;

    private Double interpolateAt;

    private String method;

    public List<Double> getXValues() { return xValues; }
    public void setXValues(List<Double> xValues) { this.xValues = xValues; }

    public List<Double> getYValues() { return yValues; }
    public void setYValues(List<Double> yValues) { this.yValues = yValues; }

    public Double getInterpolateAt() { return interpolateAt; }
    public void setInterpolateAt(Double interpolateAt) { this.interpolateAt = interpolateAt; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
}
