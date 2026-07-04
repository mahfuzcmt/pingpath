package com.webinnovation.motolink.service;

import com.webinnovation.motolink.domain.Device;
import com.webinnovation.motolink.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceService {

    private final DeviceRepository deviceRepo;

    public Optional<Device> findByImei(String imei) {
        return deviceRepo.findByImei(imei);
    }

    public void markOnline(String imei) {
        deviceRepo.markOnline(imei, Instant.now());
    }

    /**
     * Apply a heartbeat status update — refreshes presence + GSM signal so the
     * dashboard stays current for parked vehicles between location packets.
     * ACC from the heartbeat is intentionally dropped: the device row tracks
     * the last position's ACC, which is more authoritative than the heartbeat's
     * coarse status byte.
     */
    public void applyHeartbeatStatus(String imei, Integer gsmSignal) {
        deviceRepo.updateLastStatus(imei, gsmSignal, Instant.now());
    }
}
