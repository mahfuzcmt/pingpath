package com.webinnovation.pingpath.domain;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record Alarm(
        UUID id,
        UUID orgId,
        String deviceImei,
        String type,
        String severity,
        Instant ts,
        Double latitude,
        Double longitude,
        boolean acknowledged,
        UUID acknowledgedBy,
        Instant acknowledgedAt,
        Map<String, Object> metadata,
        Instant createdAt
) {}
