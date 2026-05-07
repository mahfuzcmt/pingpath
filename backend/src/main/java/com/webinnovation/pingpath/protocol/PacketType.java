package com.webinnovation.pingpath.protocol;

/**
 * GT06 protocol numbers (CLAUDE.md §6.2). Values are the on-the-wire byte.
 */
public final class PacketType {

    public static final int LOGIN = 0x01;
    public static final int LOCATION_V18 = 0x12;
    public static final int LOCATION_V3 = 0x22;
    public static final int LOCATION_V4 = 0x32;
    public static final int LOCATION_4G = 0xA0;
    public static final int HEARTBEAT = 0x13;
    public static final int ALARM = 0x16;
    public static final int RFID = 0x17;
    public static final int COMMAND_REPLY = 0x15;
    public static final int SERVER_COMMAND = 0x80;
    public static final int ADDRESS_QUERY = 0x1A;

    private PacketType() {}

    public static boolean isLocation(int proto) {
        return proto == LOCATION_V18
                || proto == LOCATION_V3
                || proto == LOCATION_V4
                || proto == LOCATION_4G;
    }
}
