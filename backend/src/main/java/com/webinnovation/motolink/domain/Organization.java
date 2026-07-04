package com.webinnovation.motolink.domain;

import java.time.Instant;
import java.util.UUID;

public record Organization(
        UUID id,
        String name,
        String slug,
        String planTier,
        String status,
        String contactEmail,
        String contactPhone,
        String address,
        String locale,
        String timezone,
        Instant createdAt,
        Instant updatedAt
) {}
