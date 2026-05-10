package com.webinnovation.pingpath.api;

import com.webinnovation.pingpath.dto.AlarmRuleDtos.AlarmRuleRequest;
import com.webinnovation.pingpath.dto.AlarmRuleDtos.AlarmRuleView;
import com.webinnovation.pingpath.security.TenantContext;
import com.webinnovation.pingpath.service.AlarmRuleService;
import com.webinnovation.pingpath.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/alarm-rules")
@RequiredArgsConstructor
public class AlarmRuleController {

    private final AlarmRuleService service;
    private final AuditService audit;

    @GetMapping
    public List<AlarmRuleView> list() {
        UUID orgId = TenantContext.requireOrgId();
        return service.listForOrg(orgId).stream()
                .map(r -> AlarmRuleView.of(r,
                        r.appliesToAll() ? List.of() : service.listAssignedImeis(r.id())))
                .toList();
    }

    @GetMapping("/{id}")
    public AlarmRuleView get(@PathVariable UUID id) {
        UUID orgId = TenantContext.requireOrgId();
        var r = service.getOrThrow(orgId, id);
        return AlarmRuleView.of(r, r.appliesToAll() ? List.of() : service.listAssignedImeis(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, UUID>> create(@RequestBody AlarmRuleRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        UUID id = service.create(orgId, req);
        audit.record("ALARM_RULE_CREATE", "alarm_rule", id.toString(),
                Map.of("name", req.name(), "type", req.ruleType()));
        return ResponseEntity.status(201).body(Map.of("id", id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AlarmRuleView> update(@PathVariable UUID id,
                                                @RequestBody AlarmRuleRequest req) {
        UUID orgId = TenantContext.requireOrgId();
        service.update(orgId, id, req);
        audit.record("ALARM_RULE_UPDATE", "alarm_rule", id.toString(), null);
        var r = service.getOrThrow(orgId, id);
        return ResponseEntity.ok(AlarmRuleView.of(r,
                r.appliesToAll() ? List.of() : service.listAssignedImeis(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID orgId = TenantContext.requireOrgId();
        service.delete(orgId, id);
        audit.record("ALARM_RULE_DELETE", "alarm_rule", id.toString(), null);
        return ResponseEntity.noContent().build();
    }
}
