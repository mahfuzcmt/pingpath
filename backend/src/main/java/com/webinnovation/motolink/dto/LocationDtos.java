package com.webinnovation.motolink.dto;

import com.webinnovation.motolink.domain.Location;

import java.time.Instant;

public final class LocationDtos {

    private LocationDtos() {}

    public record LocationView(
            long id,
            String imei,
            Instant ts,
            double latitude,
            double longitude,
            int speed,
            int course,
            Integer altitude,
            Integer satellites,
            boolean valid,
            Boolean accOn,
            Integer voltageMv,
            Long mileageM,
            Integer gsmSignal,
            Integer engineHoursSeconds
    ) {
        public static LocationView of(Location l) {
            return new LocationView(
                    l.id(),
                    l.deviceImei(),
                    l.ts(),
                    l.latitude(),
                    l.longitude(),
                    l.speed(),
                    l.course(),
                    l.altitude(),
                    l.satellites(),
                    l.valid(),
                    l.accOn(),
                    l.voltageMv(),
                    l.mileageM(),
                    l.gsmSignal(),
                    l.engineHoursSeconds()
            );
        }
    }
}
