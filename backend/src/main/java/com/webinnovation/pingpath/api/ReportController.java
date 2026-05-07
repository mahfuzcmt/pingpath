package com.webinnovation.pingpath.api;

import com.webinnovation.pingpath.security.TenantContext;
import com.webinnovation.pingpath.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private static final MediaType TEXT_CSV = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final ReportService service;

    @GetMapping(value = "/trips.csv", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<byte[]> tripsCsv(
            @RequestParam(name = "from") String fromIso,
            @RequestParam(name = "to") String toIso) {
        UUID orgId = TenantContext.requireOrgId();
        LocalDate from = LocalDate.parse(fromIso);
        LocalDate to = LocalDate.parse(toIso);
        byte[] body = service.tripsCsv(orgId, from, to).getBytes(StandardCharsets.UTF_8);
        return csv(body, "trips_" + from + "_" + to + ".csv");
    }

    @GetMapping(value = "/alarms.csv", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<byte[]> alarmsCsv(
            @RequestParam(name = "from") String fromIso,
            @RequestParam(name = "to") String toIso) {
        UUID orgId = TenantContext.requireOrgId();
        LocalDate from = LocalDate.parse(fromIso);
        LocalDate to = LocalDate.parse(toIso);
        byte[] body = service.alarmsCsv(orgId, from, to).getBytes(StandardCharsets.UTF_8);
        return csv(body, "alarms_" + from + "_" + to + ".csv");
    }

    private ResponseEntity<byte[]> csv(byte[] body, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(TEXT_CSV);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        headers.setContentLength(body.length);
        return new ResponseEntity<>(body, headers, 200);
    }
}
