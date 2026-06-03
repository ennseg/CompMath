package com.interpolation.controller;

import com.interpolation.model.FunctionGenerateRequest;
import com.interpolation.model.InterpolationRequest;
import com.interpolation.model.InterpolationResult;
import com.interpolation.service.FileParserService;
import com.interpolation.service.InterpolationService;
import com.interpolation.validation.ValidationException;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class InterpolationController {

    private final InterpolationService interpolationService;
    private final FileParserService fileParserService;

    public InterpolationController(InterpolationService interpolationService,
                                   FileParserService fileParserService) {
        this.interpolationService = interpolationService;
        this.fileParserService = fileParserService;
    }

    @PostMapping("/interpolate")
    public ResponseEntity<InterpolationResult> interpolate(
            @Valid @RequestBody InterpolationRequest req,
            BindingResult bindingResult) {

        if (bindingResult.hasErrors()) {
            InterpolationResult r = new InterpolationResult();
            r.setSuccess(false);
            List<String> errors = new ArrayList<>();
            bindingResult.getAllErrors().forEach(e -> errors.add(e.getDefaultMessage()));
            r.setError(String.join("; ", errors));
            return ResponseEntity.badRequest().body(r);
        }

        InterpolationResult result = interpolationService.compute(req);
        return result.isSuccess()
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }

    @PostMapping(value = "/parse-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> parseFile(@RequestParam("file") MultipartFile file) {
        try {
            FileParserService.ParsedData data = fileParserService.parse(file);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "x", data.x(),
                    "y", data.y(),
                    "count", data.x().size()
            ));
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Ошибка обработки файла: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/generate-function")
    public ResponseEntity<InterpolationResult> generateFunction(
            @RequestBody FunctionGenerateRequest req) {
        InterpolationResult result = interpolationService.generateFunction(req);
        return result.isSuccess()
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }
}
