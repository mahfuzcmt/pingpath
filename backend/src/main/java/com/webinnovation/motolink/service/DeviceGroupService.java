package com.webinnovation.motolink.service;

import com.webinnovation.motolink.domain.DeviceGroup;
import com.webinnovation.motolink.exception.DomainException;
import com.webinnovation.motolink.exception.NotFoundException;
import com.webinnovation.motolink.repository.DeviceGroupRepository;
import com.webinnovation.motolink.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceGroupService {

    private final DeviceGroupRepository groupRepo;
    private final DeviceRepository deviceRepo;

    public List<DeviceGroup> listForOrg(UUID orgId) {
        return groupRepo.listForOrg(orgId);
    }

    public DeviceGroup getById(UUID orgId, UUID id) {
        return groupRepo.findById(orgId, id)
                .orElseThrow(() -> new NotFoundException("Device group not found: " + id));
    }

    public Map<UUID, Integer> getDeviceCounts(UUID orgId) {
        return groupRepo.countDevicesByGroup(orgId);
    }

    @Transactional
    public DeviceGroup create(UUID orgId, String name, String description, String color, String icon) {
        // Check for duplicate name
        if (groupRepo.findByName(orgId, name).isPresent()) {
            throw new DomainException("DUPLICATE_NAME", "A group with this name already exists");
        }

        // Get max sort order
        List<DeviceGroup> existing = groupRepo.listForOrg(orgId);
        int maxOrder = existing.stream()
                .mapToInt(DeviceGroup::sortOrder)
                .max()
                .orElse(-1);

        DeviceGroup group = new DeviceGroup(
                null,
                orgId,
                name,
                description,
                color != null ? color : "#0284C7",
                icon != null ? icon : "folder",
                maxOrder + 1,
                false,
                null,
                null
        );

        DeviceGroup created = groupRepo.create(group);
        log.info("Created device group '{}' (id={}) for org={}", name, created.id(), orgId);
        return created;
    }

    @Transactional
    public DeviceGroup update(UUID orgId, UUID id, String name, String description, String color, String icon, Integer sortOrder) {
        DeviceGroup existing = getById(orgId, id);

        if (existing.isDefault()) {
            throw new DomainException("DEFAULT_GROUP", "Cannot modify the default group");
        }

        // Check for duplicate name (if changing)
        if (name != null && !name.equals(existing.name())) {
            if (groupRepo.findByName(orgId, name).isPresent()) {
                throw new DomainException("DUPLICATE_NAME", "A group with this name already exists");
            }
        }

        int rows = groupRepo.update(orgId, id, name, description, color, icon, sortOrder);
        if (rows == 0) {
            throw new NotFoundException("Device group not found or is default: " + id);
        }

        log.info("Updated device group id={} for org={}", id, orgId);
        return getById(orgId, id);
    }

    @Transactional
    public void delete(UUID orgId, UUID id) {
        DeviceGroup existing = getById(orgId, id);

        if (existing.isDefault()) {
            throw new DomainException("DEFAULT_GROUP", "Cannot delete the default group");
        }

        int rows = groupRepo.delete(orgId, id);
        if (rows == 0) {
            throw new NotFoundException("Device group not found or is default: " + id);
        }

        log.info("Deleted device group id={} for org={}", id, orgId);
    }

    @Transactional
    public void assignDevices(UUID orgId, UUID groupId, List<String> imeis) {
        // Verify group exists (null groupId = unassign)
        if (groupId != null) {
            getById(orgId, groupId);
        }

        int rows = deviceRepo.bulkAssignToGroup(orgId, imeis, groupId);
        log.info("Assigned {} devices to group {} for org={}", rows, groupId, orgId);
    }

    @Transactional
    public void reorderGroups(UUID orgId, List<UUID> groupIds) {
        groupRepo.reorder(orgId, groupIds);
        log.info("Reordered {} groups for org={}", groupIds.size(), orgId);
    }
}
