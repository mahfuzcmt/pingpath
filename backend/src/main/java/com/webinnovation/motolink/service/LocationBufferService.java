package com.webinnovation.motolink.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.webinnovation.motolink.config.RedisConfig;
import com.webinnovation.motolink.protocol.LocationData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Buffers location updates in memory and publishes batched updates every 10 seconds.
 *
 * This reduces WebSocket message overhead from 3-10 messages/second (per device) to
 * a single batch message every 10 seconds per organization. The frontend can then
 * smoothly animate markers between positions.
 *
 * <p>Thread-safe: Multiple Netty handler threads can call {@link #buffer} concurrently.
 * The scheduled flush runs on the Spring scheduler thread and drains the buffer atomically.
 *
 * <p>Memory usage: ~200 bytes per device × number of active devices. For 100 devices
 * per org with 10 orgs = ~200 KB total — negligible.
 *
 * @see com.webinnovation.motolink.ws.BatchLocationFanout
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LocationBufferService {

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    /**
     * Buffer structure: orgId -> (imei -> latest LocationData).
     * Uses ConcurrentHashMap for thread-safe concurrent writes from Netty handlers.
     */
    private final ConcurrentHashMap<UUID, ConcurrentHashMap<String, LocationData>> buffer = new ConcurrentHashMap<>();

    /**
     * Stores cell accuracy from lookup (set by LocationService before calling buffer).
     * Key: imei, Value: accuracy in meters. Cleared on flush.
     */
    private final ConcurrentHashMap<String, Integer> cellAccuracyMap = new ConcurrentHashMap<>();

    /**
     * Buffer a location update. Called from LocationService after DB persistence.
     * Latest-wins semantics: if multiple packets arrive within the 10-second window,
     * only the packet with the newest timestamp is kept.
     *
     * @param loc Location data to buffer
     */
    public void buffer(LocationData loc) {
        if (loc.getOrgId() == null) {
            log.warn("Skipping buffer for location without orgId: imei={}", loc.getImei());
            return;
        }

        log.debug("Buffering location: imei={} orgId={} valid={}", loc.getImei(), loc.getOrgId(), loc.isValid());

        buffer.computeIfAbsent(loc.getOrgId(), k -> new ConcurrentHashMap<>())
              .compute(loc.getImei(), (imei, existing) -> {
                  if (existing == null) {
                      return loc;
                  }
                  // Latest-wins: keep the newer timestamp
                  if (loc.getTimestamp().isAfter(existing.getTimestamp())) {
                      return loc;
                  }
                  return existing;
              });
    }

    /**
     * Buffer a location update with cell tower accuracy information.
     *
     * @param loc Location data to buffer
     * @param cellAccuracyMeters Cell tower accuracy in meters (null if GPS fix was valid)
     */
    public void buffer(LocationData loc, Integer cellAccuracyMeters) {
        buffer(loc);
        if (cellAccuracyMeters != null) {
            cellAccuracyMap.put(loc.getImei(), cellAccuracyMeters);
        }
    }

    /**
     * Flush the buffer and publish batch updates to Redis every 10 seconds.
     * Each organization gets a single message containing all its devices' latest positions.
     */
    @Scheduled(fixedRate = 10_000)
    public void flushAndBroadcast() {
        log.debug("Batch flush triggered, buffer size: {}", getBufferSize());
        if (buffer.isEmpty()) {
            return;
        }

        // Drain the buffer atomically by swapping with a new empty map
        Map<UUID, ConcurrentHashMap<String, LocationData>> snapshot = new HashMap<>();
        for (UUID orgId : buffer.keySet()) {
            ConcurrentHashMap<String, LocationData> orgBuffer = buffer.remove(orgId);
            if (orgBuffer != null && !orgBuffer.isEmpty()) {
                snapshot.put(orgId, orgBuffer);
            }
        }

        // Also drain cell accuracy map
        Map<String, Integer> cellAccuracySnapshot = new HashMap<>(cellAccuracyMap);
        cellAccuracyMap.clear();

        if (snapshot.isEmpty()) {
            return;
        }

        int totalDevices = 0;
        for (Map.Entry<UUID, ConcurrentHashMap<String, LocationData>> entry : snapshot.entrySet()) {
            UUID orgId = entry.getKey();
            Map<String, LocationData> devices = entry.getValue();
            totalDevices += devices.size();

            try {
                String json = toBatchJson(orgId, devices, cellAccuracySnapshot);
                if (json != null) {
                    redis.convertAndSend(RedisConfig.BATCH_LOCATION_EVENTS_CHANNEL, json);
                }
            } catch (Exception e) {
                log.error("Failed to publish batch for orgId={}: {}", orgId, e.getMessage());
            }
        }

        log.debug("Flushed location buffer: {} orgs, {} devices", snapshot.size(), totalDevices);
    }

    /**
     * Serialize a batch of locations for one organization.
     *
     * Format:
     * {
     *   "orgId": "uuid",
     *   "locations": [
     *     { "imei": "...", "ts": "...", "latitude": ..., ... },
     *     ...
     *   ]
     * }
     */
    private String toBatchJson(UUID orgId, Map<String, LocationData> devices, Map<String, Integer> cellAccuracyMap) {
        List<Map<String, Object>> locationList = new ArrayList<>();

        for (LocationData d : devices.values()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("imei", d.getImei());
            m.put("ts", d.getTimestamp().toString());
            m.put("latitude", d.getLatitude());
            m.put("longitude", d.getLongitude());
            m.put("speed", d.getSpeed());
            m.put("course", d.getCourse());
            m.put("valid", d.isValid());
            m.put("lastValidTs", d.isValid() ? d.getTimestamp().toString() : null);
            m.put("satellites", d.getSatellites());
            m.put("accOn", d.getAccOn());
            m.put("voltageMv", d.getVoltageMv());
            m.put("mileageMeters", d.getMileageMeters());
            m.put("gsmSignal", d.getGsmSignal());
            m.put("engineHoursSeconds", d.getAccOnTimeSeconds() == null ? null : d.getAccOnTimeSeconds().intValue());
            m.put("cellAccuracyMeters", cellAccuracyMap.get(d.getImei()));
            locationList.add(m);
        }

        Map<String, Object> batch = new LinkedHashMap<>();
        batch.put("orgId", orgId.toString());
        batch.put("locations", locationList);

        try {
            return objectMapper.writeValueAsString(batch);
        } catch (JsonProcessingException e) {
            log.warn("Batch JSON serialization failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Get current buffer size for monitoring.
     *
     * @return Total number of buffered locations across all orgs
     */
    public int getBufferSize() {
        int total = 0;
        for (ConcurrentHashMap<String, LocationData> orgBuffer : buffer.values()) {
            total += orgBuffer.size();
        }
        return total;
    }
}
