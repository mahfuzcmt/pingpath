package com.webinnovation.motolink.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webinnovation.motolink.config.RedisConfig;
import com.webinnovation.motolink.domain.Alarm;
import com.webinnovation.motolink.domain.enums.AlarmSeverity;
import com.webinnovation.motolink.domain.enums.AlarmType;
import com.webinnovation.motolink.exception.NotFoundException;
import com.webinnovation.motolink.repository.AlarmRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Persists alarms and broadcasts them via Redis pub/sub. The Redis listener
 * ({@link com.webinnovation.motolink.ws.AlarmFanout}) routes each event to
 * {@code /topic/org/{orgId}/alarms} so only that tenant's STOMP subscribers
 * receive it (CLAUDE.md §7.5).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlarmService {

    private final AlarmRepository repo;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final SmsService smsService;

    public Alarm raise(UUID orgId, String imei, AlarmType type, AlarmSeverity severity,
                       Instant ts, Double lat, Double lng, Map<String, Object> metadata) {
        UUID id = repo.insert(orgId, imei, type.name(), severity.name(), ts, lat, lng, metadata);
        Alarm a = repo.findByOrgAndId(orgId, id)
                .orElseThrow(() -> new IllegalStateException("Alarm vanished after insert: " + id));
        publish(a);
        if (severity == AlarmSeverity.CRITICAL) {
            // Phase 3: stub log-only — Phase 4 will resolve owner contacts.
            smsService.sendAlarmSms(a, null, severity + " " + type + " on " + imei);
        }
        return a;
    }

    public Alarm getOrThrow(UUID orgId, UUID id) {
        return repo.findByOrgAndId(orgId, id)
                .orElseThrow(() -> new NotFoundException("Alarm not found: " + id));
    }

    public List<Alarm> listForOrg(UUID orgId, Boolean onlyUnacked, int limit, int offset) {
        return repo.listForOrg(orgId, onlyUnacked, clamp(limit, 1, 500), Math.max(0, offset));
    }

    public List<Alarm> listForDevice(UUID orgId, String imei, int limit, int offset) {
        return repo.listForDevice(orgId, imei, clamp(limit, 1, 500), Math.max(0, offset));
    }

    public List<Alarm> listForRange(UUID orgId, Instant from, Instant to) {
        return repo.findInRange(orgId, from, to);
    }

    public boolean acknowledge(UUID orgId, UUID alarmId, UUID userId) {
        return repo.acknowledge(orgId, alarmId, userId);
    }

    private void publish(Alarm a) {
        try {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.id().toString());
            m.put("orgId", a.orgId().toString());
            m.put("imei", a.deviceImei());
            m.put("type", a.type());
            m.put("severity", a.severity());
            m.put("ts", a.ts().toString());
            m.put("latitude", a.latitude());
            m.put("longitude", a.longitude());
            m.put("metadata", a.metadata());
            redis.convertAndSend(RedisConfig.ALARM_EVENTS_CHANNEL, objectMapper.writeValueAsString(m));
        } catch (Exception e) {
            log.warn("Alarm publish failed for id={}: {}", a.id(), e.getMessage());
        }
    }

    private static int clamp(int v, int lo, int hi) {
        return Math.min(Math.max(v, lo), hi);
    }
}
