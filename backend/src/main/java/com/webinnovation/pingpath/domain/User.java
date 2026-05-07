package com.webinnovation.pingpath.domain;

import java.time.Instant;
import java.util.UUID;

public record User(
        UUID id,
        UUID orgId,
        String email,
        String phone,
        String passwordHash,
        String fullName,
        String role,
        boolean isActive,
        Instant lastLoginAt,
        Instant createdAt,
        Instant updatedAt
) {}
