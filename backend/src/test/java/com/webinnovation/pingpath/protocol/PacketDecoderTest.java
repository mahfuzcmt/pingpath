package com.webinnovation.pingpath.protocol;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import org.junit.jupiter.api.Test;

import java.nio.ByteBuffer;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class PacketDecoderTest {

    private final PacketDecoder decoder = new PacketDecoder();

    @Test
    void decodes_bcd_imei_correctly() {
        // 864290061234567 → padded to "0864290061234567" → 8 bytes
        byte[] bcd = {0x08, 0x64, 0x29, 0x00, 0x61, 0x23, 0x45, 0x67};
        ByteBuf buf = Unpooled.wrappedBuffer(bcd);
        try {
            assertThat(decoder.decodeLoginImei(buf)).isEqualTo("864290061234567");
        } finally {
            buf.release();
        }
    }

    @Test
    void decodes_v3_location_round_trip() {
        // Build a V3 location content payload by hand, then decode and compare.
        double targetLat = 23.7806;
        double targetLng = 90.4193;
        long latRaw = (long) (targetLat * 1_800_000);
        long lngRaw = (long) (targetLng * 1_800_000);

        ByteBuffer bb = ByteBuffer.allocate(64);
        // Date: 2026-05-07 12:34:56 UTC
        bb.put((byte) 26).put((byte) 5).put((byte) 7).put((byte) 12).put((byte) 34).put((byte) 56);
        bb.put((byte) ((12 << 4) | 0x0C));   // gps info length / satellites
        bb.putInt((int) (latRaw & 0xFFFFFFFFL));
        bb.putInt((int) (lngRaw & 0xFFFFFFFFL));
        bb.put((byte) 42);                    // speed
        bb.putShort((short) (0x1000 | 90));   // valid + course=90, north/east
        bb.putShort((short) 470);             // MCC
        bb.put((byte) 1);                     // MNC
        bb.putShort((short) 0x1234);          // LAC
        bb.put((byte) 0).put((byte) 0x12).put((byte) 0x34);  // cell id 24-bit
        bb.put((byte) 1);                     // ACC on
        bb.put((byte) 0);                     // upload mode
        bb.put((byte) 1);                     // realtime
        bb.putInt(1234);                      // mileage km

        bb.flip();
        ByteBuf content = Unpooled.wrappedBuffer(bb);
        try {
            LocationData loc = decoder.decodeLocation(content, PacketType.LOCATION_V3);
            assertThat(loc.getLatitude()).isCloseTo(targetLat, org.assertj.core.data.Offset.offset(1e-5));
            assertThat(loc.getLongitude()).isCloseTo(targetLng, org.assertj.core.data.Offset.offset(1e-5));
            assertThat(loc.getSpeed()).isEqualTo(42);
            assertThat(loc.getCourse()).isEqualTo(90);
            assertThat(loc.isValid()).isTrue();
            assertThat(loc.getSatellites()).isEqualTo(12);
            assertThat(loc.getAccOn()).isTrue();
            assertThat(loc.getMileageMeters()).isEqualTo(1_234_000L);
            assertThat(loc.getTimestamp()).isEqualTo(Instant.parse("2026-05-07T12:34:56Z"));
        } finally {
            content.release();
        }
    }

    @Test
    void v18_location_uses_degrees_minutes_formula() {
        // V1.8 raw = (deg*60 + min) * 30000 — for 23.7806 deg:
        //   minutes = 23.7806 * 60 = 1426.836
        //   raw = 1426.836 * 30000 = 42805080
        // Mathematically equivalent to V3's raw / 1_800_000:
        //   42805080 / 1_800_000 ≈ 23.78
        // The decoder formula (raw/30000)/60 should reproduce 23.7806.
        double targetLat = 23.7806;
        long raw = (long) (targetLat * 60.0 * 30000.0);

        ByteBuffer bb = ByteBuffer.allocate(64);
        bb.put((byte) 26).put((byte) 5).put((byte) 7).put((byte) 12).put((byte) 0).put((byte) 0);
        bb.put((byte) ((12 << 4) | 0x0C));
        bb.putInt((int) raw);
        bb.putInt(0);                  // longitude 0
        bb.put((byte) 0);              // speed
        bb.putShort((short) 0x1000);   // valid only
        bb.putShort((short) 0);        // MCC etc...
        bb.put((byte) 0);
        bb.putShort((short) 0);
        bb.put((byte) 0).put((byte) 0).put((byte) 0);
        bb.flip();

        ByteBuf content = Unpooled.wrappedBuffer(bb);
        try {
            LocationData loc = decoder.decodeLocation(content, PacketType.LOCATION_V18);
            assertThat(loc.getLatitude()).isCloseTo(targetLat, org.assertj.core.data.Offset.offset(1e-4));
        } finally {
            content.release();
        }
    }

    @Test
    void south_west_flags_negate_coordinates() {
        double targetLat = 23.7806;
        double targetLng = 90.4193;
        long latRaw = (long) (targetLat * 1_800_000);
        long lngRaw = (long) (targetLng * 1_800_000);

        ByteBuffer bb = ByteBuffer.allocate(64);
        bb.put((byte) 26).put((byte) 5).put((byte) 7).put((byte) 0).put((byte) 0).put((byte) 0);
        bb.put((byte) ((12 << 4) | 0x0C));
        bb.putInt((int) latRaw);
        bb.putInt((int) lngRaw);
        bb.put((byte) 0);
        bb.putShort((short) (0x1000 | 0x0400 | 0x0800));  // valid + south + west
        bb.putShort((short) 0); bb.put((byte) 0); bb.putShort((short) 0);
        bb.put((byte) 0).put((byte) 0).put((byte) 0);
        bb.put((byte) 0); bb.put((byte) 0); bb.put((byte) 0); bb.putInt(0);
        bb.flip();

        ByteBuf content = Unpooled.wrappedBuffer(bb);
        try {
            LocationData loc = decoder.decodeLocation(content, PacketType.LOCATION_V3);
            assertThat(loc.getLatitude()).isLessThan(0);
            assertThat(loc.getLongitude()).isLessThan(0);
        } finally {
            content.release();
        }
    }
}
