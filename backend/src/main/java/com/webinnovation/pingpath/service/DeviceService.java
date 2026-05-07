package com.webinnovation.pingpath.service;

import com.webinnovation.pingpath.domain.Device;
import com.webinnovation.pingpath.repository.DeviceRepository;
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
}
