package com.webinnovation.motolink.api;

import com.webinnovation.motolink.dto.AlarmDtos.AlarmView;
import com.webinnovation.motolink.exception.DomainException;
import com.webinnovation.motolink.exception.NotFoundException;
import com.webinnovation.motolink.repository.AlarmRepository.AlarmFilter;
import com.webinnovation.motolink.domain.NotificationDefaults;
import com.webinnovation.motolink.security.TenantContext;
import com.webinnovation.motolink.service.AlarmService;
import com.webinnovation.motolink.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/alarms")
@RequiredArgsConstructor
public class AlarmController {

    private final AlarmService alarmService;
    private final AuditService audit;

    private static final Set<String> SEVERITIES = Set.of("INFO", "WARNING", "CRITICAL");

    /**
     * Alarm center query. All filters optional: {@code type} (AlarmType name),
     * {@code severity}, {@code imei}, {@code from}/{@code to} (ISO-8601 instants,
     * {@code to} exclusive), {@code unacked=true}.
     */
    @GetMapping
    public List<AlarmView> list(
            @RequestParam(name = "unacked", required = false) Boolean onlyUnacked,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "severity", required = false) String severity,
            @RequestParam(name = "imei", required = false) String imei,
            @RequestParam(name = "from", required = false) Instant from,
            @RequestParam(name = "to", required = false) Instant to,
            @RequestParam(name = "limit", defaultValue = "100") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset) {
        UUID orgId = TenantContext.requireOrgId();
        String typeN = blankToNull(type);
        if (typeN != null) {
            typeN = typeN.toUpperCase(Locale.ROOT);
            if (!NotificationDefaults.isKnownType(typeN)) {
                throw new DomainException("INVALID_ALARM_TYPE", "Unknown alarm type: " + type);
            }
        }
        String sevN = blankToNull(severity);
        if (sevN != null) {
            sevN = sevN.toUpperCase(Locale.ROOT);
            if (!SEVERITIES.contains(sevN)) {
                throw new DomainException("INVALID_SEVERITY", "severity must be one of " + SEVERITIES);
            }
        }
        var filter = new AlarmFilter(onlyUnacked, typeN, sevN, blankToNull(imei), from, to);
        return alarmService.listForOrg(orgId, filter, limit, offset)
                .stream().map(AlarmView::of).toList();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    @GetMapping("/device/{imei}")
    public List<AlarmView> listForDevice(
            @PathVariable String imei,
            @RequestParam(name = "limit", defaultValue = "100") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset) {
        UUID orgId = TenantContext.requireOrgId();
        return alarmService.listForDevice(orgId, imei, limit, offset)
                .stream().map(AlarmView::of).toList();
    }

    @GetMapping("/{id}")
    public AlarmView get(@PathVariable UUID id) {
        UUID orgId = TenantContext.requireOrgId();
        return AlarmView.of(alarmService.getOrThrow(orgId, id));
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<AlarmView> acknowledge(@PathVariable UUID id) {
        UUID orgId = TenantContext.requireOrgId();
        UUID userId = TenantContext.currentUserId();
        boolean ok = alarmService.acknowledge(orgId, id, userId);
        if (!ok) {
            // Either non-existent or already acknowledged — fetch and 404 on miss.
            alarmService.getOrThrow(orgId, id);  // throws NotFoundException if missing
            throw new NotFoundException("Alarm already acknowledged: " + id);
        }
        audit.record("ALARM_ACKNOWLEDGE", "alarm", id.toString(), null);
        return ResponseEntity.ok(AlarmView.of(alarmService.getOrThrow(orgId, id)));
    }
}
