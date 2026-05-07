package com.webinnovation.pingpath.api;

import com.webinnovation.pingpath.dto.CommandDtos.CommandRequest;
import com.webinnovation.pingpath.dto.CommandDtos.CommandResponse;
import com.webinnovation.pingpath.security.TenantContext;
import com.webinnovation.pingpath.service.DeviceCommandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.CancellationException;

/**
 * Operator-facing endpoints for sending commands to devices over their open
 * GT06 channel (CLAUDE.md §7.4). Awaits the device's 0x15 reply with a 20s
 * synchronous block — for end-user APIs, async polling would be a follow-up.
 */
@RestController
@RequestMapping("/devices/{imei}/commands")
@RequiredArgsConstructor
public class DeviceCommandController {

    private static final long REPLY_WAIT_MS = 20_000;

    private final DeviceCommandService commandService;

    @GetMapping("/online")
    public Map<String, Boolean> isOnline(@PathVariable String imei) {
        return Map.of("online", commandService.isOnline(imei));
    }

    @PostMapping("/cut-fuel")
    public ResponseEntity<CommandResponse> cutFuel(@PathVariable String imei,
                                                   @RequestBody CommandRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        return await(commandService.cutFuel(orgId, imei, req.devicePassword()));
    }

    @PostMapping("/restore-fuel")
    public ResponseEntity<CommandResponse> restoreFuel(@PathVariable String imei,
                                                       @RequestBody CommandRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        return await(commandService.restoreFuel(orgId, imei, req.devicePassword()));
    }

    @PostMapping("/query-address")
    public ResponseEntity<CommandResponse> queryAddress(@PathVariable String imei,
                                                        @RequestBody CommandRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        return await(commandService.queryAddress(orgId, imei, req.devicePassword()));
    }

    @PostMapping("/raw")
    public ResponseEntity<CommandResponse> raw(@PathVariable String imei,
                                               @RequestBody CommandRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        if (req.rawCommand() == null || req.rawCommand().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(CommandResponse.failure("rawCommand required"));
        }
        return await(commandService.sendRaw(orgId, imei, req.rawCommand()));
    }

    private ResponseEntity<CommandResponse> await(CompletableFuture<String> future) {
        try {
            String reply = future.get(REPLY_WAIT_MS, TimeUnit.MILLISECONDS);
            return ResponseEntity.ok(CommandResponse.success(reply));
        } catch (TimeoutException e) {
            return ResponseEntity.status(504)
                    .body(CommandResponse.failure("Device did not reply within timeout"));
        } catch (CancellationException | InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(503)
                    .body(CommandResponse.failure("Command cancelled"));
        } catch (ExecutionException e) {
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            int status = cause instanceof SecurityException ? 403
                    : cause instanceof IllegalStateException ? 409
                    : 500;
            return ResponseEntity.status(status)
                    .body(CommandResponse.failure(cause.getMessage()));
        }
    }
}
