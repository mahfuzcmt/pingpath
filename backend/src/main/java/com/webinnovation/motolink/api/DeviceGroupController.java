package com.webinnovation.motolink.api;

import com.webinnovation.motolink.domain.DeviceGroup;
import com.webinnovation.motolink.dto.DeviceGroupDtos.*;
import com.webinnovation.motolink.security.TenantContext;
import com.webinnovation.motolink.service.DeviceGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class DeviceGroupController {

    private final DeviceGroupService groupService;

    @GetMapping
    public List<DeviceGroupView> list() {
        UUID orgId = TenantContext.requireOrgId();
        List<DeviceGroup> groups = groupService.listForOrg(orgId);
        Map<UUID, Integer> counts = groupService.getDeviceCounts(orgId);

        return groups.stream()
                .map(g -> DeviceGroupView.of(g, counts.getOrDefault(g.id(), 0)))
                .toList();
    }

    @GetMapping("/{id}")
    public DeviceGroupView get(@PathVariable UUID id) {
        UUID orgId = TenantContext.requireOrgId();
        DeviceGroup group = groupService.getById(orgId, id);
        Map<UUID, Integer> counts = groupService.getDeviceCounts(orgId);
        return DeviceGroupView.of(group, counts.getOrDefault(group.id(), 0));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeviceGroupView create(@Valid @RequestBody CreateGroupRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        DeviceGroup group = groupService.create(
                orgId,
                req.name(),
                req.description(),
                req.color(),
                req.icon()
        );
        return DeviceGroupView.of(group, 0);
    }

    @PatchMapping("/{id}")
    public DeviceGroupView update(@PathVariable UUID id, @Valid @RequestBody UpdateGroupRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        DeviceGroup group = groupService.update(
                orgId,
                id,
                req.name(),
                req.description(),
                req.color(),
                req.icon(),
                req.sortOrder()
        );
        Map<UUID, Integer> counts = groupService.getDeviceCounts(orgId);
        return DeviceGroupView.of(group, counts.getOrDefault(group.id(), 0));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        UUID orgId = TenantContext.requireOrgId();
        groupService.delete(orgId, id);
    }

    @PostMapping("/{id}/devices")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void assignDevices(@PathVariable UUID id, @Valid @RequestBody AssignDevicesRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        groupService.assignDevices(orgId, id, req.imeis());
    }

    @DeleteMapping("/{id}/devices")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unassignDevices(@PathVariable UUID id, @Valid @RequestBody AssignDevicesRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        // Unassign by setting group to null
        groupService.assignDevices(orgId, null, req.imeis());
    }

    @PostMapping("/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@Valid @RequestBody ReorderGroupsRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        groupService.reorderGroups(orgId, req.groupIds());
    }
}
