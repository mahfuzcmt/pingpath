package com.webinnovation.pingpath.domain;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

public record AlarmRule(
        UUID id,
        UUID orgId,
        String name,
        String ruleType,
        Double threshold,
        LocalTime windowStart,
        LocalTime windowEnd,
        int cooldownSeconds,
        String severity,
        boolean active,
        boolean appliesToAll,
        Instant createdAt,
        Instant updatedAt
) {}
