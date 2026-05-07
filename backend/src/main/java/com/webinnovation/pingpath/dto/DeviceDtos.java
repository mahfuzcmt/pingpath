package com.webinnovation.pingpath.dto;

import com.webinnovation.pingpath.domain.Device;

import java.time.Instant;
import java.util.UUID;

public final class DeviceDtos {

    private DeviceDtos() {}

    public record DeviceView(
            UUID id,
            String imei,
            String name,
            String vehiclePlate,
            String vehicleType,
            String protocol,
            String protocolVariant,
            String model,
            String status,
            Instant lastSeenAt,
            Double lastLatitude,
            Double lastLongitude,
            Integer lastSpeed,
            Integer lastCourse,
            Integer lastVoltageMv,
            String iconColor
    ) {
        public static DeviceView of(Device d) {
            return new DeviceView(
                    d.id(),
                    d.imei(),
                    d.name(),
                    d.vehiclePlate(),
                    d.vehicleType(),
                    d.protocol(),
                    d.protocolVariant(),
                    d.model(),
                    d.status(),
                    d.lastSeenAt(),
                    d.lastLatitude(),
                    d.lastLongitude(),
                    d.lastSpeed(),
                    d.lastCourse(),
                    d.lastVoltageMv(),
                    d.iconColor()
            );
        }
    }
}
