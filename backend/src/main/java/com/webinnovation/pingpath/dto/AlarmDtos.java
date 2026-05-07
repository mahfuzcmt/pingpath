package com.webinnovation.pingpath.dto;

import com.webinnovation.pingpath.domain.Alarm;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public final class AlarmDtos {

    private AlarmDtos() {}

    public record AlarmView(
            UUID id,
            String deviceImei,
            String type,
            String severity,
            Instant ts,
            Double latitude,
            Double longitude,
            boolean acknowledged,
            UUID acknowledgedBy,
            Instant acknowledgedAt,
            Map<String, Object> metadata
    ) {
        public static AlarmView of(Alarm a) {
            return new AlarmView(
                    a.id(), a.deviceImei(), a.type(), a.severity(), a.ts(),
                    a.latitude(), a.longitude(),
                    a.acknowledged(), a.acknowledgedBy(), a.acknowledgedAt(),
                    a.metadata()
            );
        }
    }
}
