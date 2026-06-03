package com.interpolation.service;

import com.interpolation.validation.ValidationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class FileParserService {

    private static final int MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB
    private static final int MAX_LINES = 60;

    public record ParsedData(List<Double> x, List<Double> y) {}

    public ParsedData parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Файл не выбран или пуст");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ValidationException("Файл слишком большой (максимум 1 МБ)");
        }

        String filename = file.getOriginalFilename();
        if (filename != null) {
            String lower = filename.toLowerCase();
            if (!lower.endsWith(".txt") && !lower.endsWith(".csv") && !lower.endsWith(".dat")) {
                throw new ValidationException("Поддерживаемые форматы файлов: .txt, .csv, .dat");
            }
        }

        List<Double> xList = new ArrayList<>();
        List<Double> yList = new ArrayList<>();
        int lineNum = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            while ((line = reader.readLine()) != null) {
                lineNum++;
                if (lineNum > MAX_LINES) {
                    throw new ValidationException("Файл содержит слишком много строк (максимум " + MAX_LINES + ")");
                }

                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || line.startsWith("//")) continue;

                String[] parts = line.split("[,;\\t]+|\\s+");
                if (parts.length < 2) {
                    throw new ValidationException(
                            "Строка " + lineNum + ": ожидается два числа (x и y), найдено: '" + line + "'"
                    );
                }
                if (parts.length > 2) {
                    throw new ValidationException(
                            "Строка " + lineNum + ": слишком много столбцов (" + parts.length + "), ожидается 2 (x и y)"
                    );
                }

                double x = parseDouble(parts[0].trim(), lineNum, "x");
                double y = parseDouble(parts[1].trim(), lineNum, "y");

                xList.add(x);
                yList.add(y);
            }
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new ValidationException("Ошибка чтения файла: " + e.getMessage());
        }

        if (xList.isEmpty()) {
            throw new ValidationException("Файл не содержит данных (только пустые строки или комментарии)");
        }
        if (xList.size() < 2) {
            throw new ValidationException("Файл содержит только 1 строку данных. Необходимо минимум 2 узла интерполяции");
        }

        return new ParsedData(xList, yList);
    }

    private double parseDouble(String token, int lineNum, String field) {
        token = token.replace(',', '.');
        try {
            double val = Double.parseDouble(token);
            if (!Double.isFinite(val)) {
                throw new ValidationException(
                        "Строка " + lineNum + ", поле " + field + ": значение '" + token + "' не является конечным числом"
                );
            }
            return val;
        } catch (NumberFormatException e) {
            throw new ValidationException(
                    "Строка " + lineNum + ", поле " + field + ": '" + token + "' не является числом. " +
                    "Используйте точку или запятую в качестве десятичного разделителя"
            );
        }
    }
}
