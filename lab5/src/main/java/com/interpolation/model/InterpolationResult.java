package com.interpolation.model;

import java.util.List;
import java.util.Map;

public class InterpolationResult {

    private boolean success;
    private String error;

    private List<List<Double>> differenceTable;
    private List<String> tableHeaders;

    private Map<String, Double> methodResults;

    private List<Double> graphX;
    private List<List<Double>> graphY;

    private List<String> methodNames;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public List<List<Double>> getDifferenceTable() { return differenceTable; }
    public void setDifferenceTable(List<List<Double>> differenceTable) { this.differenceTable = differenceTable; }

    public List<String> getTableHeaders() { return tableHeaders; }
    public void setTableHeaders(List<String> tableHeaders) { this.tableHeaders = tableHeaders; }

    public Map<String, Double> getMethodResults() { return methodResults; }
    public void setMethodResults(Map<String, Double> methodResults) { this.methodResults = methodResults; }

    public List<Double> getGraphX() { return graphX; }
    public void setGraphX(List<Double> graphX) { this.graphX = graphX; }

    public List<List<Double>> getGraphY() { return graphY; }
    public void setGraphY(List<List<Double>> graphY) { this.graphY = graphY; }

    public List<String> getMethodNames() { return methodNames; }
    public void setMethodNames(List<String> methodNames) { this.methodNames = methodNames; }
}
