package com.webinnovation.motolink.service;

import com.webinnovation.motolink.domain.Device;
import com.webinnovation.motolink.repository.DeviceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class DeviceService {

    private final DeviceRepository deviceRepo;
    private final UUID defaultOrgId;

    public DeviceService(DeviceRepository deviceRepo,
                         @Value("${motolink.device.auto-register-org-id:00000000-0000-0000-0000-000000000001}") String defaultOrgIdStr) {
        this.deviceRepo = deviceRepo;
        this.defaultOrgId = UUID.fromString(defaultOrgIdStr);
    }

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

    /**
     * Auto-register a new device when it first connects.
     * Creates the device with a generated name and the default org.
     */
    public Device autoRegister(String imei) {
        String name = "New Device " + imei.substring(Math.max(0, imei.length() - 6));
        log.info("Auto-registering new device IMEI={} as '{}' in org={}", imei, name, defaultOrgId);
        return deviceRepo.createDevice(defaultOrgId, imei, name);
    }
}
