package com.webinnovation.motolink.service;

import com.webinnovation.motolink.domain.Trip;
import com.webinnovation.motolink.exception.NotFoundException;
import com.webinnovation.motolink.protocol.LocationData;
import com.webinnovation.motolink.repository.LocationRepository;
import com.webinnovation.motolink.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Trip detection per CLAUDE.md §7.3.
 *
 * <p>Open conditions: ACC turns on, OR speed &gt; 5 km/h after a long idle gap.<br>
 * Close conditions: ACC explicitly off + speed=0, OR a sweeper closes after 10 min
 * of no location updates ({@link #closeStaleTrips}).
 *
 * <p>Distance is accumulated by haversine between the previously persisted point
 * and the current one — both are visible to this method because
 * {@link LocationService#saveAndBroadcast} calls us <em>after</em> the new sample
 * has been written.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TripService {

    /** km/h above which we treat the device as moving even without an explicit ACC signal. */
    private static final int MOVING_SPEED_THRESHOLD = 5;

    /** Idle gap (seconds) after which a movement-without-ACC restarts a trip. */
    private static final long RESTART_IDLE_SECONDS = 5 * 60;

    /** Sweeper threshold: open trips with no location updates for this long are closed. */
    public static final int STALE_TRIP_SECONDS = 10 * 60;

    private final TripRepository tripRepo;
    private final LocationRepository locationRepo;

    public void onLocation(LocationData loc) {
        if (loc.getOrgId() == null || loc.getImei() == null || !loc.isValid()) return;
        try {
            Optional<Trip> openOpt = tripRepo.findOpenForDevice(loc.getImei());

            if (openOpt.isEmpty()) {
                if (shouldOpenTrip(loc)) {
                    UUID id = tripRepo.insertOpen(
                            loc.getOrgId(), loc.getImei(), loc.getTimestamp(),
                            loc.getLatitude(), loc.getLongitude());
                    log.debug("Opened trip {} for imei={}", id, loc.getImei());
                }
                return;
            }

            Trip open = openOpt.get();
            int deltaM = computeDeltaMeters(loc);
            tripRepo.appendPoint(open.id(), deltaM, loc.getSpeed(),
                    loc.getLatitude(), loc.getLongitude());

            if (shouldCloseTrip(loc)) {
                tripRepo.closeTrip(open.id(), loc.getTimestamp(),
                        loc.getLatitude(), loc.getLongitude());
                log.debug("Closed trip {} for imei={}", open.id(), loc.getImei());
            }
        } catch (Exception e) {
            log.warn("Trip processing failed for imei={}: {}", loc.getImei(), e.getMessage(), e);
        }
    }

    /** Periodic sweeper closes trips that have stopped receiving locations. */
    public int closeStaleTrips() {
        List<UUID> stale = tripRepo.findStaleOpenTripIds(STALE_TRIP_SECONDS);
        Instant now = Instant.now();
        for (UUID id : stale) {
            tripRepo.closeTripKeepEndGeom(id, now);
        }
        return stale.size();
    }

    public Trip getOrThrow(UUID orgId, UUID id) {
        return tripRepo.findByOrgAndId(orgId, id)
                .orElseThrow(() -> new NotFoundException("Trip not found: " + id));
    }

    public List<Trip> listForOrg(UUID orgId, Instant from, Instant to, int limit, int offset) {
        return tripRepo.listForOrg(orgId, from, to,
                Math.min(Math.max(limit, 1), 500), Math.max(0, offset));
    }

    public List<Trip> listForDevice(UUID orgId, String imei, Instant from, Instant to) {
        return tripRepo.listForDevice(orgId, imei, from, to);
    }

    private boolean shouldOpenTrip(LocationData loc) {
        if (Boolean.TRUE.equals(loc.getAccOn())) return true;
        if (loc.getSpeed() <= MOVING_SPEED_THRESHOLD) return false;
        // Movement without ACC — only open if the device has been quiet for a while
        // (avoids spuriously starting from a single GPS jitter).
        return locationRepo.findLastForImei(loc.getImei())
                .map(prev -> prev.ts().isBefore(loc.getTimestamp().minusSeconds(RESTART_IDLE_SECONDS)))
                .orElse(true);
    }

    private boolean shouldCloseTrip(LocationData loc) {
        return Boolean.FALSE.equals(loc.getAccOn()) && loc.getSpeed() == 0;
    }

    /**
     * Compute distance from the prior persisted location for this device. Returns 0
     * when no prior point exists or the prior point is the one we just inserted.
     */
    private int computeDeltaMeters(LocationData loc) {
        // The current sample has already been persisted by LocationRepository.insert before
        // we run, so query for the second-most-recent row to get the real prior point.
        return locationRepo.findHistory(
                loc.getOrgId(), loc.getImei(),
                loc.getTimestamp().minusSeconds(3600),
                loc.getTimestamp().plusSeconds(1),
                2)
                .stream()
                .filter(l -> l.ts().isBefore(loc.getTimestamp()))
                .findFirst()
                .map(prev -> (int) Math.round(
                        haversineMeters(prev.latitude(), prev.longitude(),
                                loc.getLatitude(), loc.getLongitude())))
                .orElse(0);
    }

    private static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double r = 6_371_000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return r * c;
    }
}
