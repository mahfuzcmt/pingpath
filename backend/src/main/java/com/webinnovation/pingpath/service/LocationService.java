package com.webinnovation.pingpath.service;

import com.webinnovation.pingpath.config.RedisConfig;
import com.webinnovation.pingpath.protocol.LocationData;
import com.webinnovation.pingpath.repository.DeviceRepository;
import com.webinnovation.pingpath.repository.LocationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Hot-path persistence + cache + pub/sub for location packets (CLAUDE.md §7.1).
 *
 * Called from the ingestion executor, AFTER the Netty handler has already ACKed
 * the device on its event loop. ACK-first / persist-second is rule #1 of §3.2.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final LocationRepository locationRepo;
    private final DeviceRepository deviceRepo;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final GeofenceService geofenceService;
    private final TripService tripService;
    private final AlarmRuleService alarmRuleService;

    public void saveAndBroadcast(LocationData loc) {
        try {
            locationRepo.insert(loc);

            Integer engineHoursSeconds = loc.getAccOnTimeSeconds() == null
                    ? null : loc.getAccOnTimeSeconds().intValue();
            deviceRepo.updateLastPosition(
                    loc.getImei(),
                    loc.getLatitude(),
                    loc.getLongitude(),
                    loc.getSpeed(),
                    loc.getCourse(),
                    loc.getVoltageMv(),
                    loc.getGsmSignal(),
                    engineHoursSeconds,
                    loc.getTimestamp()
            );

            String json = toJson(loc);
            if (json != null) {
                redis.opsForValue().set("device:last:" + loc.getImei(), json, Duration.ofHours(24));
                redis.convertAndSend(RedisConfig.LOCATION_EVENTS_CHANNEL, json);
            }

            // Phase 3: evaluate geofences and progress trip detection. Both run on the
            // ingest virtual-thread executor — they share its budget, not the event loop.
            geofenceService.evaluate(loc);
            tripService.onLocation(loc);
            alarmRuleService.evaluate(loc);
        } catch (Exception e) {
            log.error("saveAndBroadcast failed for imei={}: {}", loc.getImei(), e.getMessage(), e);
        }
    }

    private String toJson(LocationData d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("imei", d.getImei());
        m.put("orgId", d.getOrgId());
        m.put("ts", d.getTimestamp().toString());
        m.put("latitude", d.getLatitude());
        m.put("longitude", d.getLongitude());
        m.put("speed", d.getSpeed());
        m.put("course", d.getCourse());
        m.put("valid", d.isValid());
        m.put("satellites", d.getSatellites());
        m.put("accOn", d.getAccOn());
        m.put("voltageMv", d.getVoltageMv());
        m.put("mileageMeters", d.getMileageMeters());
        m.put("gsmSignal", d.getGsmSignal());
        m.put("engineHoursSeconds", d.getAccOnTimeSeconds() == null ? null : d.getAccOnTimeSeconds().intValue());
        try {
            return objectMapper.writeValueAsString(m);
        } catch (JsonProcessingException e) {
            log.warn("location JSON serialization failed: {}", e.getMessage());
            return null;
        }
    }
}
