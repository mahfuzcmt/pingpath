package com.webinnovation.motolink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for user-device assignment operations.
 */
public final class UserDeviceDtos {

    private UserDeviceDtos() {}

    /**
     * Request to assign devices to a user.
     */
    public record AssignDevicesRequest(
            @NotNull UUID userId,
            @NotEmpty List<String> deviceImeis
    ) {}

    /**
     * Request to unassign a device from a user.
     */
    public record UnassignDeviceRequest(
            @NotNull UUID userId,
            @NotBlank String deviceImei
    ) {}

    /**
     * Request to replace all device assignments for a user.
     */
    public record SetUserDevicesRequest(
            @NotNull UUID userId,
            List<String> deviceImeis  // can be empty to clear all assignments
    ) {}

    /**
     * Request to update user's seeAllDevices setting.
     */
    public record UpdateSeeAllDevicesRequest(
            @NotNull UUID userId,
            boolean seeAllDevices
    ) {}

    /**
     * View of a user with their device assignment info.
     */
    public record UserDeviceAssignmentView(
            UUID userId,
            String email,
            String fullName,
            String role,
            boolean seeAllDevices,
            int assignedDeviceCount,
            List<String> assignedImeis
    ) {}

    /**
     * View of device assignment details.
     */
    public record DeviceAssignmentView(
            String imei,
            String name,
            String vehiclePlate,
            List<AssignedUserInfo> assignedUsers
    ) {}

    /**
     * Brief info about a user assigned to a device.
     */
    public record AssignedUserInfo(
            UUID userId,
            String email,
            String fullName
    ) {}
}
