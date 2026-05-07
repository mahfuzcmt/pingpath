package com.webinnovation.pingpath.netty;

import io.netty.buffer.ByteBuf;

/**
 * CRC-ITU (X.25 CRC-16) — poly 0x1021, init 0xFFFF, no reflection, XOR-out 0xFFFF.
 * Computed over [Length] [ProtocolNumber] [Content] [Serial] (CLAUDE.md §6.6).
 */
public final class ChecksumUtil {

    private static final int[] TABLE = new int[256];

    static {
        for (int i = 0; i < 256; i++) {
            int crc = i << 8;
            for (int j = 0; j < 8; j++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
            }
            TABLE[i] = crc & 0xFFFF;
        }
    }

    private ChecksumUtil() {}

    public static int crcItu(ByteBuf buf, int offset, int length) {
        int crc = 0xFFFF;
        for (int i = 0; i < length; i++) {
            crc = TABLE[((crc >> 8) ^ buf.getByte(offset + i)) & 0xFF] ^ (crc << 8);
        }
        return (~crc) & 0xFFFF;
    }

    public static int crcItu(byte[] data, int offset, int length) {
        int crc = 0xFFFF;
        for (int i = 0; i < length; i++) {
            crc = TABLE[((crc >> 8) ^ data[offset + i]) & 0xFF] ^ (crc << 8);
        }
        return (~crc) & 0xFFFF;
    }
}
