package com.webinnovation.motolink.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Device group for organizing vehicles into categories.
 * Matches ADL Moto Viewer's device grouping functionality.
 */
public record DeviceGroup(
        UUID id,
        UUID orgId,
        String name,
        String description,
        String color,
        String icon,
        int sortOrder,
        boolean isDefault,
        Instant createdAt,
        Instant updatedAt
) {
    public static DeviceGroup withDefaults(UUID orgId, String name) {
        return new DeviceGroup(
                null,
                orgId,
                name,
                null,
                "#0284C7",
                "folder",
                0,
                false,
                Instant.now(),
                Instant.now()
        );
    }
}
