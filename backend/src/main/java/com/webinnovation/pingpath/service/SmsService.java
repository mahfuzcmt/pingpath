package com.webinnovation.pingpath.service;

import com.webinnovation.pingpath.domain.Alarm;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * SMS dispatch contract. Phase 3 ships a logging stub; Phase 4 will plug in
 * SSL Wireless (CLAUDE.md §7.6, §15) for transactional outbound messages.
 *
 * <p>The contract is intentionally narrow: emit a single message for a single
 * recipient. Templating, locale selection, and user/contact resolution live in
 * the caller (typically {@link AlarmService}).
 */
@Service
@Slf4j
public class SmsService {

    public void sendAlarmSms(Alarm alarm, String recipientMsisdn, String message) {
        if (recipientMsisdn == null || recipientMsisdn.isBlank()) {
            log.debug("SMS skipped: no recipient for alarm {}", alarm.id());
            return;
        }
        log.info("[SMS-STUB] to={} type={} imei={} msg={}",
                recipientMsisdn, alarm.type(), alarm.deviceImei(), message);
    }

    public void sendRaw(String recipientMsisdn, String message) {
        log.info("[SMS-STUB] to={} msg={}", recipientMsisdn, message);
    }
}
