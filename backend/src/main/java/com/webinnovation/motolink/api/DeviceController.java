package com.webinnovation.motolink.api;

import com.webinnovation.motolink.domain.Device;
import com.webinnovation.motolink.dto.DeviceDtos.DeviceUpdateRequest;
import com.webinnovation.motolink.dto.DeviceDtos.DeviceView;
import com.webinnovation.motolink.exception.DomainException;
import com.webinnovation.motolink.exception.NotFoundException;
import com.webinnovation.motolink.repository.DeviceRepository;
import com.webinnovation.motolink.repository.SubscriptionRepository;
import com.webinnovation.motolink.repository.SubscriptionRepository.SubInfo;
import com.webinnovation.motolink.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceRepository deviceRepo;
    private final SubscriptionRepository subscriptionRepo;

    @GetMapping
    public List<DeviceView> list(@RequestParam(value = "status", required = false) String status) {
        UUID orgId = TenantContext.requireOrgId();
        List<Device> devices = (status == null || status.isBlank())
                ? deviceRepo.listForOrg(orgId)
                : deviceRepo.listForOrgByStatus(orgId, status);
        Map<String, SubInfo> subs = subscriptionRepo.latestByOrg(orgId);
        return devices.stream().map(d -> DeviceView.of(d, subs.get(d.imei()))).toList();
    }

    @GetMapping("/{imei}")
    public DeviceView get(@PathVariable String imei) {
        UUID orgId = TenantContext.requireOrgId();
        Device d = deviceRepo.findByOrgAndImei(orgId, imei)
                .orElseThrow(() -> new NotFoundException("device", imei));
        return DeviceView.of(d, subscriptionRepo.latestForImei(orgId, imei).orElse(null));
    }

    private static final Set<String> VEHICLE_TYPES = Set.of("MOTORBIKE", "CAR", "TRUCK", "CNG", "BUS");
    private static final Pattern HEX_COLOR = Pattern.compile("#[0-9a-fA-F]{6}");

    @PatchMapping("/{imei}")
    public DeviceView update(@PathVariable String imei, @RequestBody DeviceUpdateRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        if (req.vehicleType() != null && !VEHICLE_TYPES.contains(req.vehicleType())) {
            throw new DomainException("INVALID_VEHICLE_TYPE",
                    "vehicleType must be one of " + VEHICLE_TYPES);
        }
        if (req.iconColor() != null && !HEX_COLOR.matcher(req.iconColor()).matches()) {
            throw new DomainException("INVALID_ICON_COLOR", "iconColor must be #RRGGBB");
        }
        int updated = deviceRepo.updateProfile(orgId, imei,
                req.name(), req.vehiclePlate(), req.vehicleType(), req.iconColor());
        if (updated == 0) throw new NotFoundException("device", imei);
        Device d = deviceRepo.findByOrgAndImei(orgId, imei)
                .orElseThrow(() -> new NotFoundException("device", imei));
        return DeviceView.of(d, subscriptionRepo.latestForImei(orgId, imei).orElse(null));
    }
}
