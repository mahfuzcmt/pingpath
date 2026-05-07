package com.webinnovation.pingpath.api;

import com.webinnovation.pingpath.domain.User;
import com.webinnovation.pingpath.dto.AuthDtos.LoginRequest;
import com.webinnovation.pingpath.dto.AuthDtos.LoginResponse;
import com.webinnovation.pingpath.dto.AuthDtos.RefreshRequest;
import com.webinnovation.pingpath.dto.AuthDtos.TokenPair;
import com.webinnovation.pingpath.dto.AuthDtos.UserSummary;
import com.webinnovation.pingpath.exception.NotFoundException;
import com.webinnovation.pingpath.repository.UserRepository;
import com.webinnovation.pingpath.security.TenantContext;
import com.webinnovation.pingpath.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepo;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/refresh")
    public TokenPair refresh(@Valid @RequestBody RefreshRequest req) {
        return authService.refresh(req);
    }

    @GetMapping("/me")
    public UserSummary me() {
        UUID userId = TenantContext.currentUserId();
        if (userId == null) {
            throw new NotFoundException("user", "current");
        }
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("user", userId.toString()));
        return new UserSummary(u.id(), u.email(), u.fullName(), u.role(), u.orgId());
    }
}
