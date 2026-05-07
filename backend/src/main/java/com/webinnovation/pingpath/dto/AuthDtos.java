package com.webinnovation.pingpath.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8) String password
    ) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record TokenPair(String accessToken, String refreshToken) {}

    public record UserSummary(UUID id, String email, String fullName, String role, UUID orgId) {}

    public record OrgSummary(UUID id, String name, String slug, String planTier, String locale, String timezone) {}

    public record LoginResponse(
            String accessToken,
            String refreshToken,
            UserSummary user,
            OrgSummary org
    ) {}
}
