package com.webinnovation.pingpath.api;

import com.webinnovation.pingpath.domain.Device;
import com.webinnovation.pingpath.dto.DeviceDtos.DeviceView;
import com.webinnovation.pingpath.exception.NotFoundException;
import com.webinnovation.pingpath.repository.DeviceRepository;
import com.webinnovation.pingpath.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceRepository deviceRepo;

    @GetMapping
    public List<DeviceView> list(@RequestParam(value = "status", required = false) String status) {
        UUID orgId = TenantContext.requireOrgId();
        List<Device> devices = (status == null || status.isBlank())
                ? deviceRepo.listForOrg(orgId)
                : deviceRepo.listForOrgByStatus(orgId, status);
        return devices.stream().map(DeviceView::of).toList();
    }

    @GetMapping("/{imei}")
    public DeviceView get(@PathVariable String imei) {
        UUID orgId = TenantContext.requireOrgId();
        Device d = deviceRepo.findByOrgAndImei(orgId, imei)
                .orElseThrow(() -> new NotFoundException("device", imei));
        return DeviceView.of(d);
    }
}
