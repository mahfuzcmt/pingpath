package com.webinnovation.pingpath.netty;

import io.netty.util.AttributeKey;

import java.util.UUID;

/**
 * Channel attribute keys carried for the lifetime of a device's TCP connection.
 * Set by LoginHandler after IMEI extraction (CLAUDE.md §6.4).
 */
public final class ChannelKeys {

    public static final AttributeKey<String> IMEI_KEY = AttributeKey.valueOf("pingpath.imei");
    public static final AttributeKey<UUID> ORG_ID_KEY = AttributeKey.valueOf("pingpath.orgId");
    public static final AttributeKey<Boolean> REGISTERED_KEY = AttributeKey.valueOf("pingpath.registered");

    private ChannelKeys() {}
}
