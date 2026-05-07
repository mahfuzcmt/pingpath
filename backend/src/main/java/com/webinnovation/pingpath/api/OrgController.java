package com.webinnovation.pingpath.api;

import com.webinnovation.pingpath.domain.Organization;
import com.webinnovation.pingpath.domain.User;
import com.webinnovation.pingpath.dto.OrgDtos.OrgUpdate;
import com.webinnovation.pingpath.dto.OrgDtos.OrgView;
import com.webinnovation.pingpath.dto.OrgDtos.UserCreate;
import com.webinnovation.pingpath.dto.OrgDtos.UserUpdate;
import com.webinnovation.pingpath.dto.OrgDtos.UserView;
import com.webinnovation.pingpath.exception.DomainException;
import com.webinnovation.pingpath.exception.ForbiddenException;
import com.webinnovation.pingpath.exception.NotFoundException;
import com.webinnovation.pingpath.repository.OrganizationRepository;
import com.webinnovation.pingpath.repository.UserRepository;
import com.webinnovation.pingpath.security.TenantContext;
import com.webinnovation.pingpath.service.AuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/orgs")
@RequiredArgsConstructor
public class OrgController {

    private static final String ROLE_ADMIN = "ORG_ADMIN";
    private static final String ROLE_SUPER = "SUPER_ADMIN";

    private final OrganizationRepository orgRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuditService audit;

    @GetMapping("/me")
    public OrgView getMyOrg() {
        UUID orgId = TenantContext.requireOrgId();
        Organization org = orgRepo.findById(orgId)
                .orElseThrow(() -> new NotFoundException("organization", orgId.toString()));
        return OrgView.of(org);
    }

    @PatchMapping("/me")
    public OrgView updateMyOrg(@RequestBody OrgUpdate body) {
        requireAdmin();
        UUID orgId = TenantContext.requireOrgId();
        int rows = orgRepo.update(orgId, body.name(), body.contactEmail(), body.contactPhone(),
                body.address(), body.locale(), body.timezone());
        if (rows == 0) {
            throw new NotFoundException("organization", orgId.toString());
        }
        Organization updated = orgRepo.findById(orgId).orElseThrow();
        audit.record("ORG_UPDATE", "organization", orgId.toString(),
                Map.of("fields", nonNullFields(body)));
        return OrgView.of(updated);
    }

    @GetMapping("/me/users")
    public List<UserView> listUsers() {
        UUID orgId = TenantContext.requireOrgId();
        return userRepo.listByOrg(orgId).stream().map(UserView::of).toList();
    }

    @PostMapping("/me/users")
    public ResponseEntity<UserView> createUser(@Valid @RequestBody UserCreate body) {
        requireAdmin();
        UUID orgId = TenantContext.requireOrgId();

        if (userRepo.findByEmail(body.email()).isPresent()) {
            throw new DomainException("EMAIL_TAKEN", "Email already in use");
        }
        String role = normalizeRole(body.role());
        UUID id = userRepo.createInOrg(orgId, body.email(), body.phone(),
                passwordEncoder.encode(body.password()), body.fullName(), role);
        User created = userRepo.findById(id).orElseThrow();

        audit.record("USER_CREATE", "user", id.toString(),
                Map.of("email", body.email(), "role", role));
        return ResponseEntity.status(HttpStatus.CREATED).body(UserView.of(created));
    }

    @PatchMapping("/me/users/{id}")
    public UserView updateUser(@PathVariable UUID id, @RequestBody UserUpdate body) {
        requireAdmin();
        UUID orgId = TenantContext.requireOrgId();

        User existing = userRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("user", id.toString()));
        if (!orgId.equals(existing.orgId())) {
            throw new NotFoundException("user", id.toString());
        }

        String role = body.role() == null ? null : normalizeRole(body.role());
        userRepo.update(id, orgId, body.fullName(), body.phone(), role, body.isActive());

        if (body.password() != null && !body.password().isBlank()) {
            if (body.password().length() < 8) {
                throw new DomainException("WEAK_PASSWORD", "Password must be at least 8 characters");
            }
            userRepo.updatePassword(id, orgId, passwordEncoder.encode(body.password()));
        }

        User updated = userRepo.findById(id).orElseThrow();
        audit.record("USER_UPDATE", "user", id.toString(),
                Map.of("fields", nonNullFields(body), "passwordChanged",
                        body.password() != null && !body.password().isBlank()));
        return UserView.of(updated);
    }

    @DeleteMapping("/me/users/{id}")
    public ResponseEntity<Void> disableUser(@PathVariable UUID id) {
        requireAdmin();
        UUID orgId = TenantContext.requireOrgId();
        UUID self = TenantContext.currentUserId();
        if (id.equals(self)) {
            throw new DomainException("SELF_DISABLE",
                    "You cannot disable your own account");
        }
        int rows = userRepo.softDelete(id, orgId);
        if (rows == 0) {
            throw new NotFoundException("user", id.toString());
        }
        audit.record("USER_DISABLE", "user", id.toString(), null);
        return ResponseEntity.noContent().build();
    }

    private static void requireAdmin() {
        String role = TenantContext.currentRole();
        if (role == null || (!ROLE_ADMIN.equals(role) && !ROLE_SUPER.equals(role))) {
            throw new ForbiddenException("Admin role required");
        }
    }

    private static String normalizeRole(String role) {
        String r = role == null ? "" : role.trim().toUpperCase();
        return switch (r) {
            case "SUPER_ADMIN", "ORG_ADMIN", "ORG_USER" -> r;
            default -> throw new DomainException("INVALID_ROLE",
                    "Role must be one of SUPER_ADMIN, ORG_ADMIN, ORG_USER");
        };
    }

    private static List<String> nonNullFields(Object record) {
        var fields = new java.util.ArrayList<String>();
        for (var c : record.getClass().getRecordComponents()) {
            try {
                Object v = c.getAccessor().invoke(record);
                if (v != null) fields.add(c.getName());
            } catch (Exception ignored) { /* skip */ }
        }
        return fields;
    }
}
