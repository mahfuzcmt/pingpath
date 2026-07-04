package com.webinnovation.motolink.api;

import com.webinnovation.motolink.dto.AlarmDtos.AlarmView;
import com.webinnovation.motolink.exception.NotFoundException;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/alarms")
@RequiredArgsConstructor
public class AlarmController {

    private final AlarmService alarmService;
    private final AuditService audit;

    @GetMapping
    public List<AlarmView> list(
            @RequestParam(name = "unacked", required = false) Boolean onlyUnacked,
            @RequestParam(name = "limit", defaultValue = "100") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset) {
        UUID orgId = TenantContext.requireOrgId();
        return alarmService.listForOrg(orgId, onlyUnacked, limit, offset)
                .stream().map(AlarmView::of).toList();
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
