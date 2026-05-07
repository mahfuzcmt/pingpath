package com.webinnovation.pingpath.service;

import com.webinnovation.pingpath.domain.Alarm;
import com.webinnovation.pingpath.domain.Trip;
import com.webinnovation.pingpath.repository.AlarmRepository;
import com.webinnovation.pingpath.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Aggregates Phase 3 reportable events and renders them as CSV. PDF and Excel
 * formats are intentionally deferred to Phase 4 per CLAUDE.md §16 — CSV alone
 * satisfies the Phase 3 exit criteria of "Trip with start/end appears on report."
 *
 * <p>All timestamps render in Asia/Dhaka local time so Bangladesh operators can
 * read them at a glance; the CSV header notes the zone explicitly.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final ZoneId DHAKA = ZoneId.of("Asia/Dhaka");
    private static final DateTimeFormatter ISO_LOCAL =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final TripRepository tripRepo;
    private final AlarmRepository alarmRepo;

    public String tripsCsv(UUID orgId, LocalDate from, LocalDate to) {
        Instant fromTs = from.atStartOfDay(DHAKA).toInstant();
        Instant toTs = to.plusDays(1).atStartOfDay(DHAKA).toInstant();
        List<Trip> trips = tripRepo.listForOrg(orgId, fromTs, toTs, 10_000, 0);

        StringBuilder sb = new StringBuilder();
        sb.append("# trips report ").append(from).append(" to ").append(to).append(" (Asia/Dhaka)\n");
        sb.append("trip_id,device_imei,started_at,ended_at,distance_km,duration_min,max_speed_kmh,avg_speed_kmh,status\n");
        for (Trip t : trips) {
            sb.append(t.id()).append(',')
              .append(escape(t.deviceImei())).append(',')
              .append(localTs(t.startedAt())).append(',')
              .append(localTs(t.endedAt())).append(',')
              .append(String.format("%.2f", t.distanceM() / 1000.0)).append(',')
              .append(t.durationS() == null ? "" : (t.durationS() / 60)).append(',')
              .append(t.maxSpeed()).append(',')
              .append(t.avgSpeed()).append(',')
              .append(t.status())
              .append('\n');
        }
        return sb.toString();
    }

    public String alarmsCsv(UUID orgId, LocalDate from, LocalDate to) {
        Instant fromTs = from.atStartOfDay(DHAKA).toInstant();
        Instant toTs = to.plusDays(1).atStartOfDay(DHAKA).toInstant();
        List<Alarm> alarms = alarmRepo.findInRange(orgId, fromTs, toTs);

        StringBuilder sb = new StringBuilder();
        sb.append("# alarms report ").append(from).append(" to ").append(to).append(" (Asia/Dhaka)\n");
        sb.append("alarm_id,device_imei,type,severity,ts,latitude,longitude,acknowledged\n");
        for (Alarm a : alarms) {
            sb.append(a.id()).append(',')
              .append(escape(a.deviceImei())).append(',')
              .append(a.type()).append(',')
              .append(a.severity()).append(',')
              .append(localTs(a.ts())).append(',')
              .append(a.latitude() == null ? "" : a.latitude()).append(',')
              .append(a.longitude() == null ? "" : a.longitude()).append(',')
              .append(a.acknowledged())
              .append('\n');
        }
        return sb.toString();
    }

    private static String localTs(Instant ts) {
        if (ts == null) return "";
        return ISO_LOCAL.format(ts.atZone(DHAKA).toLocalDateTime());
    }

    private static String escape(String s) {
        if (s == null) return "";
        if (s.indexOf(',') < 0 && s.indexOf('"') < 0 && s.indexOf('\n') < 0) return s;
        return '"' + s.replace("\"", "\"\"") + '"';
    }

    /** Convenience wrapper for "today (Asia/Dhaka)" lookups. */
    public LocalDate today() {
        return LocalDate.now(DHAKA);
    }

    /** Convenience: convert wall-clock UTC midnight to LocalDate in Dhaka. */
    public LocalDate toDhakaLocalDate(Instant ts) {
        return ts.atZone(DHAKA).toLocalDate();
    }

    /** Exposed so callers can compute month boundaries without re-importing the zone. */
    public ZoneOffset dhakaOffset() {
        return DHAKA.getRules().getOffset(Instant.now());
    }
}
