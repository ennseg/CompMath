package com.interpolation.model;

public class FunctionGenerateRequest {

    private String functionName;
    private Double start;
    private Double end;
    private Integer points;

    public String getFunctionName() { return functionName; }
    public void setFunctionName(String functionName) { this.functionName = functionName; }

    public Double getStart() { return start; }
    public void setStart(Double start) { this.start = start; }

    public Double getEnd() { return end; }
    public void setEnd(Double end) { this.end = end; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
}
