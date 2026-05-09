package com.webinnovation.pingpath.protocol;

import io.netty.buffer.ByteBuf;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Decodes the variable payload of a GT06 frame after the protocol number byte.
 * Caller hands us a slice positioned at the start of [Content] and limited to
 * the content length (excludes Length, ProtocolNumber, Serial, CRC, Stop).
 */
@Component
public class PacketDecoder {

    /** Decode 8-byte BCD-packed IMEI from a login (0x01) packet. */
    public String decodeLoginImei(ByteBuf content) {
        byte[] bcd = new byte[8];
        content.readBytes(bcd);
        StringBuilder sb = new StringBuilder(16);
        for (byte b : bcd) {
            sb.append((b >> 4) & 0x0F);
            sb.append(b & 0x0F);
        }
        // 8 bytes → 16 nibbles, IMEI is 15 digits, leading nibble is padding
        return sb.length() > 15 ? sb.substring(sb.length() - 15) : sb.toString();
    }

    /** Decode location packet variants 0x12 / 0x22 / 0x32 / 0xA0 (CLAUDE.md §6.5). */
    public LocationData decodeLocation(ByteBuf content, int protocolNumber) {
        LocationData loc = new LocationData();
        loc.setProtocolNumber(protocolNumber);
        loc.setTimestamp(decodeDateTime(content));

        int gpsByte = content.readUnsignedByte();
        loc.setGpsInfoLength((gpsByte >> 4) & 0x0F);
        loc.setSatellites(gpsByte & 0x0F);

        long latRaw = content.readUnsignedInt();
        long lonRaw = content.readUnsignedInt();
        loc.setSpeed(content.readUnsignedByte());

        int courseStatus = content.readUnsignedShort();
        loc.setCourse(courseStatus & 0x03FF);
        loc.setValid((courseStatus & 0x1000) != 0);
        // GT06 hemisphere bits (per Traccar reference):
        // Bit 10 (0x0400): 0 = South, 1 = North
        // Bit 11 (0x0800): 0 = East, 1 = West
        boolean south = (courseStatus & 0x0400) == 0;
        boolean west  = (courseStatus & 0x0800) != 0;

        double lat;
        double lon;
        if (protocolNumber == PacketType.LOCATION_V18) {
            // V1.8: (deg×60 + min) × 30000 → divide by 30000 then by 60 to get degrees
            lat = (latRaw / 30000.0) / 60.0;
            lon = (lonRaw / 30000.0) / 60.0;
        } else {
            // V3 / V4 / 4G
            lat = latRaw / 1_800_000.0;
            lon = lonRaw / 1_800_000.0;
        }
        if (south) lat = -lat;
        if (west)  lon = -lon;
        loc.setLatitude(lat);
        loc.setLongitude(lon);

        // LBS (cell tower)
        if (protocolNumber == PacketType.LOCATION_4G) {
            int mcc = content.readUnsignedShort();
            boolean mncLong = (mcc & 0x8000) != 0;
            loc.setMcc(mcc & 0x7FFF);
            loc.setMnc(mncLong ? content.readUnsignedShort() : content.readUnsignedByte());
            loc.setLac((int) content.readUnsignedInt());
            loc.setCellId(content.readLong());
        } else if (content.readableBytes() >= 8) {
            loc.setMcc(content.readUnsignedShort());
            loc.setMnc(content.readUnsignedByte());
            loc.setLac(content.readUnsignedShort());
            loc.setCellId(read24BitInt(content));
        }

        // V3 / V4 / 4G additional fields
        if (protocolNumber == PacketType.LOCATION_V3
                || protocolNumber == PacketType.LOCATION_V4
                || protocolNumber == PacketType.LOCATION_4G) {
            if (content.readableBytes() >= 7) {
                loc.setAccOn(content.readUnsignedByte() == 1);
                loc.setUploadMode((int) content.readUnsignedByte());
                loc.setRealtimeFlag((int) content.readUnsignedByte());
                loc.setMileageMeters(content.readUnsignedInt() * 1000L);  // km → m
            }
        }

        if (protocolNumber == PacketType.LOCATION_V4
                || protocolNumber == PacketType.LOCATION_4G) {
            if (content.readableBytes() >= 2) {
                loc.setVoltageMv(content.readUnsignedShort() * 10);  // 0.01V → mV
            }
        }
        if (protocolNumber == PacketType.LOCATION_V4) {
            if (content.readableBytes() >= 4) {
                loc.setAccOnTimeSeconds(content.readUnsignedInt());
            }
            if (content.readableBytes() >= 2) {
                content.skipBytes(2);  // reserved
            }
        }

        return loc;
    }

    /**
     * Decode a 0x16 alarm packet. Layout = location body (treated as V3 lat/lng scale,
     * no V3-extension fields) + 5 status bytes:
     * <pre>
     *   [device-status:1][voltage-level:1][gsm-strength:1][alarm-code:1][language:1]
     * </pre>
     * The device-status byte's bit 1 carries ACC; bits 3-5 carry an alarm hint that
     * historically duplicates the dedicated alarm-code byte.
     */
    public LocationData decodeAlarm(ByteBuf content) {
        LocationData loc = new LocationData();
        loc.setProtocolNumber(PacketType.ALARM);
        loc.setTimestamp(decodeDateTime(content));

        int gpsByte = content.readUnsignedByte();
        loc.setGpsInfoLength((gpsByte >> 4) & 0x0F);
        loc.setSatellites(gpsByte & 0x0F);

        long latRaw = content.readUnsignedInt();
        long lonRaw = content.readUnsignedInt();
        loc.setSpeed(content.readUnsignedByte());

        int courseStatus = content.readUnsignedShort();
        loc.setCourse(courseStatus & 0x03FF);
        loc.setValid((courseStatus & 0x1000) != 0);
        // GT06 hemisphere bits (per Traccar reference):
        // Bit 10 (0x0400): 0 = South, 1 = North
        // Bit 11 (0x0800): 0 = East, 1 = West
        boolean south = (courseStatus & 0x0400) == 0;
        boolean west = (courseStatus & 0x0800) != 0;

        double lat = latRaw / 1_800_000.0;
        double lon = lonRaw / 1_800_000.0;
        if (south) lat = -lat;
        if (west) lon = -lon;
        loc.setLatitude(lat);
        loc.setLongitude(lon);

        // LBS — same layout as standard location
        if (content.readableBytes() >= 8) {
            loc.setMcc(content.readUnsignedShort());
            loc.setMnc(content.readUnsignedByte());
            loc.setLac(content.readUnsignedShort());
            loc.setCellId(read24BitInt(content));
        }

        // Status block (5 bytes)
        if (content.readableBytes() >= 5) {
            int status = content.readUnsignedByte();
            loc.setAccOn((status & 0x02) != 0);
            int voltageLevel = content.readUnsignedByte();
            loc.setVoltageMv(voltageLevel * 1000);  // coarse 0-6 → 0-6000 mV (no precise value here)
            content.readUnsignedByte();  // gsm strength — discarded for now
            loc.setAlarmCode(content.readUnsignedByte());
            content.readUnsignedByte();  // language byte — discarded
        }
        return loc;
    }

    private static java.time.Instant decodeDateTime(ByteBuf buf) {
        int yy = buf.readUnsignedByte();
        int mo = buf.readUnsignedByte();
        int dd = buf.readUnsignedByte();
        int hh = buf.readUnsignedByte();
        int mi = buf.readUnsignedByte();
        int ss = buf.readUnsignedByte();
        return LocalDateTime.of(2000 + yy, mo, dd, hh, mi, ss).toInstant(ZoneOffset.UTC);
    }

    private static long read24BitInt(ByteBuf buf) {
        int hi = buf.readUnsignedByte();
        int mid = buf.readUnsignedByte();
        int lo = buf.readUnsignedByte();
        return ((long) hi << 16) | (mid << 8) | lo;
    }
}
