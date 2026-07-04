package com.webinnovation.motolink.service;

import com.webinnovation.motolink.domain.Organization;
import com.webinnovation.motolink.domain.User;
import com.webinnovation.motolink.dto.AuthDtos.LoginRequest;
import com.webinnovation.motolink.dto.AuthDtos.LoginResponse;
import com.webinnovation.motolink.dto.AuthDtos.OrgSummary;
import com.webinnovation.motolink.dto.AuthDtos.RefreshRequest;
import com.webinnovation.motolink.dto.AuthDtos.TokenPair;
import com.webinnovation.motolink.dto.AuthDtos.UserSummary;
import com.webinnovation.motolink.exception.DomainException;
import com.webinnovation.motolink.repository.OrganizationRepository;
import com.webinnovation.motolink.repository.RefreshTokenRepository;
import com.webinnovation.motolink.repository.RefreshTokenRepository.RefreshTokenRow;
import com.webinnovation.motolink.repository.UserRepository;
import com.webinnovation.motolink.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepo;
    private final OrganizationRepository orgRepo;
    private final RefreshTokenRepository refreshRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService audit;

    private static final SecureRandom RNG = new SecureRandom();

    public LoginResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.email())
                .orElseThrow(() -> new DomainException("INVALID_CREDENTIALS", "Email or password is incorrect"));

        if (!user.isActive()) {
            throw new DomainException("ACCOUNT_INACTIVE", "Account is suspended");
        }
        if (!passwordEncoder.matches(req.password(), user.passwordHash())) {
            throw new DomainException("INVALID_CREDENTIALS", "Email or password is incorrect");
        }
        if (user.orgId() == null) {
            throw new DomainException("NO_ORG", "User is not assigned to an organization");
        }

        Organization org = orgRepo.findById(user.orgId())
                .orElseThrow(() -> new DomainException("ORG_NOT_FOUND", "Organization missing for user"));

        userRepo.touchLastLogin(user.id());

        TokenPair tokens = issueTokens(user.id(), user.orgId(), user.role());

        // login happens before TenantContext is set on the request — pass actor explicitly
        audit.recordFor(user.orgId(), user.id(), "AUTH_LOGIN", "user", user.id().toString(),
                java.util.Map.of("email", user.email()));

        return new LoginResponse(
                tokens.accessToken(),
                tokens.refreshToken(),
                new UserSummary(user.id(), user.email(), user.fullName(), user.role(), user.orgId()),
                new OrgSummary(org.id(), org.name(), org.slug(), org.planTier(), org.locale(), org.timezone())
        );
    }

    public TokenPair refresh(RefreshRequest req) {
        String hash = sha256(req.refreshToken());
        RefreshTokenRow row = refreshRepo.findByHash(hash)
                .orElseThrow(() -> new DomainException("INVALID_REFRESH", "Refresh token not recognized"));

        if (row.revokedAt() != null) {
            throw new DomainException("REFRESH_REVOKED", "Refresh token has been revoked");
        }
        if (row.expiresAt().isBefore(Instant.now())) {
            throw new DomainException("REFRESH_EXPIRED", "Refresh token has expired");
        }

        User user = userRepo.findById(row.userId())
                .orElseThrow(() -> new DomainException("USER_NOT_FOUND", "User no longer exists"));

        // Rotate: revoke old, issue new
        refreshRepo.revoke(row.id());
        return issueTokens(user.id(), user.orgId(), user.role());
    }

    private TokenPair issueTokens(UUID userId, UUID orgId, String role) {
        String access = jwtService.issueAccessToken(userId, orgId, role);
        String refresh = randomRefreshToken();
        Instant expiresAt = Instant.now().plus(jwtService.refreshTtl());
        refreshRepo.create(userId, sha256(refresh), expiresAt);
        return new TokenPair(access, refresh);
    }

    private static String randomRefreshToken() {
        byte[] bytes = new byte[48];
        RNG.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
