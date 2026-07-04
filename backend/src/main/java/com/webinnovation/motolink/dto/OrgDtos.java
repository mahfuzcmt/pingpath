package com.webinnovation.motolink.dto;

import com.webinnovation.motolink.domain.Organization;
import com.webinnovation.motolink.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class OrgDtos {

    private OrgDtos() {}

    public record OrgView(
            UUID id,
            String name,
            String slug,
            String planTier,
            String status,
            String contactEmail,
            String contactPhone,
            String address,
            String locale,
            String timezone,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static OrgView of(Organization o) {
            return new OrgView(
                    o.id(), o.name(), o.slug(), o.planTier(), o.status(),
                    o.contactEmail(), o.contactPhone(), o.address(),
                    o.locale(), o.timezone(), o.createdAt(), o.updatedAt());
        }
    }

    public record OrgUpdate(
            String name,
            String contactEmail,
            String contactPhone,
            String address,
            String locale,
            String timezone
    ) {}

    public record UserView(
            UUID id,
            UUID orgId,
            String email,
            String phone,
            String fullName,
            String role,
            boolean isActive,
            Instant lastLoginAt,
            Instant createdAt
    ) {
        public static UserView of(User u) {
            return new UserView(
                    u.id(), u.orgId(), u.email(), u.phone(), u.fullName(),
                    u.role(), u.isActive(), u.lastLoginAt(), u.createdAt());
        }
    }

    public record UserCreate(
            @NotBlank @Email String email,
            String phone,
            @NotBlank String fullName,
            @NotBlank String role,
            @NotBlank @Size(min = 8) String password
    ) {}

    public record UserUpdate(
            String fullName,
            String phone,
            String role,
            Boolean isActive,
            String password
    ) {}
}
