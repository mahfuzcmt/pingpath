package com.webinnovation.pingpath.service;

import com.webinnovation.pingpath.domain.AlarmRule;
import com.webinnovation.pingpath.domain.enums.AlarmSeverity;
import com.webinnovation.pingpath.domain.enums.AlarmType;
import com.webinnovation.pingpath.dto.AlarmRuleDtos.AlarmRuleRequest;
import com.webinnovation.pingpath.exception.DomainException;
import com.webinnovation.pingpath.exception.NotFoundException;
import com.webinnovation.pingpath.protocol.LocationData;
import com.webinnovation.pingpath.repository.AlarmRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Org-defined alarm rules. Replaces what would otherwise be hard-coded
 * speed/voltage/curfew checks. Three rule types in v1:
 * <ul>
 *   <li>{@code SPEED_OVER}            — fires OVERSPEED when speed > threshold (kph)</li>
 *   <li>{@code VOLTAGE_UNDER}         — fires LOW_BATTERY when voltage < threshold (mV)</li>
 *   <li>{@code ACC_ON_DURING_WINDOW}  — fires CURFEW_VIOLATION when ACC=on inside window (BD time)</li>
 * </ul>
 *
 * <p>Each rule has a per-device cooldown to avoid alarm storms (one location packet
 * every few seconds × 5 km over a speed limit = thousands of duplicate alarms).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlarmRuleService {

    private static final ZoneId BD_ZONE = ZoneId.of("Asia/Dhaka");

    private final AlarmRuleRepository repo;
    private final AlarmService alarmService;

    public AlarmRule getOrThrow(UUID orgId, UUID id) {
        return repo.findByOrgAndId(orgId, id)
                .orElseThrow(() -> new NotFoundException("Alarm rule not found: " + id));
    }

    public List<AlarmRule> listForOrg(UUID orgId) {
        return repo.listForOrg(orgId);
    }

    public List<String> listAssignedImeis(UUID ruleId) {
        return repo.listAssignedImeis(ruleId);
    }

    public UUID create(UUID orgId, AlarmRuleRequest req) {
        validate(req, true);
        UUID id = repo.insert(
                orgId,
                req.name(),
                req.ruleType(),
                req.threshold(),
                req.windowStart(),
                req.windowEnd(),
                defaultIfNull(req.cooldownSeconds(), 300),
                defaultIfNull(req.severity(), "WARNING"),
                defaultIfNull(req.active(), true),
                defaultIfNull(req.appliesToAll(), true)
        );
        if (Boolean.FALSE.equals(req.appliesToAll()) && req.assignedImeis() != null) {
            for (String imei : req.assignedImeis()) {
                if (imei != null && !imei.isBlank()) repo.assignDevice(id, imei);
            }
        }
        return id;
    }

    public void update(UUID orgId, UUID id, AlarmRuleRequest req) {
        validate(req, false);
        if (!repo.update(orgId, id, req.name(), req.threshold(),
                req.windowStart(), req.windowEnd(), req.cooldownSeconds(),
                req.severity(), req.active(), req.appliesToAll())) {
            throw new NotFoundException("Alarm rule not found: " + id);
        }
        if (req.assignedImeis() != null) {
            repo.unassignAllDevices(id);
            for (String imei : req.assignedImeis()) {
                if (imei != null && !imei.isBlank()) repo.assignDevice(id, imei);
            }
        }
    }

    public void delete(UUID orgId, UUID id) {
        if (!repo.delete(orgId, id)) {
            throw new NotFoundException("Alarm rule not found: " + id);
        }
    }

    /**
     * Hot-path evaluation. Called from {@link LocationService#saveAndBroadcast} after
     * geofence/trip evaluation. Rules with no matching predicate are silently skipped.
     */
    public void evaluate(LocationData loc) {
        if (loc.getOrgId() == null || loc.getImei() == null) return;
        try {
            List<AlarmRule> rules = repo.findActiveForDevice(loc.getOrgId(), loc.getImei());
            for (AlarmRule r : rules) {
                if (!matches(r, loc)) continue;
                if (!repo.tryFire(r.id(), loc.getImei(), r.cooldownSeconds(), Instant.now())) {
                    continue;  // still within cooldown
                }
                fire(r, loc);
            }
        } catch (Exception e) {
            log.warn("Alarm-rule evaluation failed for imei={}: {}", loc.getImei(), e.getMessage(), e);
        }
    }

    private boolean matches(AlarmRule r, LocationData loc) {
        return switch (r.ruleType()) {
            case "SPEED_OVER" -> r.threshold() != null && loc.getSpeed() > r.threshold();
            case "VOLTAGE_UNDER" -> r.threshold() != null
                    && loc.getVoltageMv() != null
                    && loc.getVoltageMv() < r.threshold();
            case "ACC_ON_DURING_WINDOW" -> Boolean.TRUE.equals(loc.getAccOn())
                    && inWindow(r.windowStart(), r.windowEnd(), loc.getTimestamp());
            default -> false;
        };
    }

    private void fire(AlarmRule r, LocationData loc) {
        AlarmType type = switch (r.ruleType()) {
            case "SPEED_OVER" -> AlarmType.OVERSPEED;
            case "VOLTAGE_UNDER" -> AlarmType.LOW_BATTERY;
            case "ACC_ON_DURING_WINDOW" -> AlarmType.CURFEW_VIOLATION;
            default -> null;
        };
        if (type == null) return;
        AlarmSeverity sev = AlarmSeverity.valueOf(r.severity());
        Map<String, Object> meta = new HashMap<>();
        meta.put("ruleId", r.id().toString());
        meta.put("ruleName", r.name());
        meta.put("ruleType", r.ruleType());
        if (r.threshold() != null) meta.put("threshold", r.threshold());
        if ("SPEED_OVER".equals(r.ruleType())) meta.put("observedSpeed", loc.getSpeed());
        if ("VOLTAGE_UNDER".equals(r.ruleType())) meta.put("observedVoltageMv", loc.getVoltageMv());
        alarmService.raise(loc.getOrgId(), loc.getImei(), type, sev,
                loc.getTimestamp(), loc.getLatitude(), loc.getLongitude(), meta);
    }

    /**
     * True when {@code ts} (interpreted in Asia/Dhaka) falls inside [start, end).
     * Supports wrap-around windows (e.g. start=22:00, end=06:00 → night shift).
     */
    private boolean inWindow(LocalTime start, LocalTime end, Instant ts) {
        if (start == null || end == null || ts == null) return false;
        LocalTime now = ZonedDateTime.ofInstant(ts, BD_ZONE).toLocalTime();
        if (start.equals(end)) return false;
        if (start.isBefore(end)) {
            return !now.isBefore(start) && now.isBefore(end);
        }
        // Wrap around midnight
        return !now.isBefore(start) || now.isBefore(end);
    }

    private void validate(AlarmRuleRequest req, boolean isCreate) {
        if (isCreate) {
            if (req.name() == null || req.name().isBlank()) {
                throw new DomainException("VALIDATION", "name required");
            }
            if (req.ruleType() == null) {
                throw new DomainException("VALIDATION", "ruleType required");
            }
        }
        if (req.ruleType() != null) {
            switch (req.ruleType()) {
                case "SPEED_OVER", "VOLTAGE_UNDER" -> {
                    if (req.threshold() == null || req.threshold() <= 0) {
                        throw new DomainException("VALIDATION",
                                "threshold (positive) required for " + req.ruleType());
                    }
                }
                case "ACC_ON_DURING_WINDOW" -> {
                    if (req.windowStart() == null || req.windowEnd() == null) {
                        throw new DomainException("VALIDATION",
                                "windowStart and windowEnd required for ACC_ON_DURING_WINDOW");
                    }
                }
                default -> throw new DomainException("VALIDATION", "Unknown ruleType: " + req.ruleType());
            }
        }
        if (req.severity() != null) {
            try {
                AlarmSeverity.valueOf(req.severity());
            } catch (IllegalArgumentException e) {
                throw new DomainException("VALIDATION", "Invalid severity: " + req.severity());
            }
        }
    }

    private static <T> T defaultIfNull(T value, T fallback) {
        return value == null ? fallback : value;
    }
}
