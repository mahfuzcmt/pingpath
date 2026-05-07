package com.webinnovation.pingpath.netty;

import com.webinnovation.pingpath.domain.Device;
import com.webinnovation.pingpath.protocol.LocationData;
import com.webinnovation.pingpath.protocol.PacketDecoder;
import com.webinnovation.pingpath.protocol.PacketEncoder;
import com.webinnovation.pingpath.protocol.PacketType;
import com.webinnovation.pingpath.service.DeviceService;
import com.webinnovation.pingpath.service.LocationService;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandler.Sharable;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Receives full GT06 frames from Gt06FrameDecoder, validates CRC, ACKs immediately
 * on the event loop, then offloads persistence to the ingest virtual-thread executor.
 *
 * Layout per CLAUDE.md §6.1:
 *   [Start:2] [Length:1or2] [Proto:1] [Content:N] [Serial:2] [CRC:2] [0x0D 0x0A]
 *
 * CRC covers Length..Serial inclusive (§6.6). Content slice for decoders excludes
 * everything after [Proto].
 */
@Component
@Sharable
@Slf4j
public class Gt06Handler extends SimpleChannelInboundHandler<ByteBuf> {

    private final PacketDecoder packetDecoder;
    private final PacketEncoder packetEncoder;
    private final DeviceService deviceService;
    private final LocationService locationService;
    private final com.webinnovation.pingpath.service.AlarmService alarmService;
    private final com.webinnovation.pingpath.service.DeviceCommandService deviceCommandService;
    private final AsyncTaskExecutor ingestExecutor;

    public Gt06Handler(PacketDecoder packetDecoder,
                       PacketEncoder packetEncoder,
                       DeviceService deviceService,
                       LocationService locationService,
                       com.webinnovation.pingpath.service.AlarmService alarmService,
                       com.webinnovation.pingpath.service.DeviceCommandService deviceCommandService,
                       @Qualifier("ingestExecutor") AsyncTaskExecutor ingestExecutor) {
        this.packetDecoder = packetDecoder;
        this.packetEncoder = packetEncoder;
        this.deviceService = deviceService;
        this.locationService = locationService;
        this.alarmService = alarmService;
        this.deviceCommandService = deviceCommandService;
        this.ingestExecutor = ingestExecutor;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, ByteBuf frame) {
        int frameStart = frame.readerIndex();
        int frameLen = frame.readableBytes();

        int b0 = frame.getUnsignedByte(frameStart);
        int b1 = frame.getUnsignedByte(frameStart + 1);
        boolean extended = (b0 == 0x79 && b1 == 0x79);
        int lenFieldSize = extended ? 2 : 1;

        int payloadLen = extended
                ? frame.getUnsignedShort(frameStart + 2)
                : frame.getUnsignedByte(frameStart + 2);

        // Layout offsets (relative to frameStart):
        //   [0..1] start, [2..2+lenFieldSize-1] length,
        //   [headerOff] proto, then content, serial, crc, stop
        int protoOff = frameStart + 2 + lenFieldSize;
        int crcCoverStart = frameStart + 2;          // length byte(s) start
        int crcCoverLen = lenFieldSize + payloadLen - 2;  // up to & including serial, exclude crc(2)
        int crcOff = frameStart + frameLen - 4;      // 2 (CRC) + 2 (stop)
        int serialOff = crcOff - 2;
        int contentStart = protoOff + 1;
        int contentLen = serialOff - contentStart;

        int proto = frame.getUnsignedByte(protoOff);
        int serial = frame.getUnsignedShort(serialOff);
        int frameCrc = frame.getUnsignedShort(crcOff);
        int computedCrc = ChecksumUtil.crcItu(frame, crcCoverStart, crcCoverLen);

        if (frameCrc != computedCrc) {
            log.warn("CRC mismatch: proto=0x{} got=0x{} expected=0x{} — dropping",
                    Integer.toHexString(proto),
                    Integer.toHexString(frameCrc),
                    Integer.toHexString(computedCrc));
            return;
        }

        // Slice the content (between proto and serial) for the decoder
        ByteBuf content = frame.retainedSlice(contentStart, Math.max(0, contentLen));
        try {
            dispatch(ctx, proto, serial, content);
        } finally {
            content.release();
        }
    }

    private void dispatch(ChannelHandlerContext ctx, int proto, int serial, ByteBuf content) {
        switch (proto) {
            case PacketType.LOGIN -> handleLogin(ctx, serial, content);
            case PacketType.LOCATION_V18, PacketType.LOCATION_V3,
                 PacketType.LOCATION_V4, PacketType.LOCATION_4G ->
                    handleLocation(ctx, proto, serial, content);
            case PacketType.HEARTBEAT -> handleHeartbeat(ctx, serial);
            case PacketType.ALARM -> handleAlarm(ctx, serial, content);
            case PacketType.COMMAND_REPLY -> handleCommandReply(ctx, content);
            default -> {
                log.debug("Unhandled protocol 0x{}, ACKing serial {}",
                        Integer.toHexString(proto), serial);
                ctx.writeAndFlush(packetEncoder.buildAck(proto, serial));
            }
        }
    }

    private void handleLogin(ChannelHandlerContext ctx, int serial, ByteBuf content) {
        if (content.readableBytes() < 8) {
            log.warn("Login content too short ({} bytes)", content.readableBytes());
            return;
        }
        String imei = packetDecoder.decodeLoginImei(content);
        log.info("Login from IMEI={} channel={}", imei, ctx.channel().id());

        // ACK first — devices disconnect after 5s without a response
        ctx.writeAndFlush(packetEncoder.buildLoginAck(serial));

        // Lookup off the event loop
        ingestExecutor.execute(() -> {
            Optional<Device> deviceOpt = deviceService.findByImei(imei);
            if (deviceOpt.isEmpty()) {
                log.warn("Unregistered IMEI {} — connection kept", imei);
                ctx.channel().attr(ChannelKeys.IMEI_KEY).set(imei);
                ctx.channel().attr(ChannelKeys.REGISTERED_KEY).set(false);
                return;
            }
            Device d = deviceOpt.get();
            ctx.channel().attr(ChannelKeys.IMEI_KEY).set(imei);
            ctx.channel().attr(ChannelKeys.ORG_ID_KEY).set(d.orgId());
            ctx.channel().attr(ChannelKeys.REGISTERED_KEY).set(true);
            deviceCommandService.registerChannel(imei, ctx.channel());
            deviceService.markOnline(imei);
        });
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        String imei = ctx.channel().attr(ChannelKeys.IMEI_KEY).get();
        if (imei != null) {
            deviceCommandService.unregisterChannel(imei, ctx.channel());
        }
    }

    private void handleLocation(ChannelHandlerContext ctx, int proto, int serial, ByteBuf content) {
        // ACK immediately
        ctx.writeAndFlush(packetEncoder.buildAck(proto, serial));

        Boolean registered = ctx.channel().attr(ChannelKeys.REGISTERED_KEY).get();
        if (registered == null || !registered) {
            log.debug("Dropping location packet from unregistered channel id={}",
                    ctx.channel().id());
            return;
        }

        String imei = ctx.channel().attr(ChannelKeys.IMEI_KEY).get();
        UUID orgId = ctx.channel().attr(ChannelKeys.ORG_ID_KEY).get();
        if (imei == null || orgId == null) {
            log.debug("Dropping location packet — missing imei/orgId on channel attrs");
            return;
        }

        // Snapshot the bytes before crossing threads — content slice is event-loop-bound
        byte[] raw = new byte[content.readableBytes()];
        content.getBytes(content.readerIndex(), raw);

        ingestExecutor.execute(() -> {
            try {
                io.netty.buffer.ByteBuf detached = io.netty.buffer.Unpooled.wrappedBuffer(raw);
                LocationData loc = packetDecoder.decodeLocation(detached, proto);
                loc.setImei(imei);
                loc.setOrgId(orgId);
                loc.setRawPayload(raw);
                locationService.saveAndBroadcast(loc);
            } catch (Exception e) {
                log.error("Location decode/persist failed for imei={}: {}", imei, e.getMessage(), e);
            }
        });
    }

    private void handleAlarm(ChannelHandlerContext ctx, int serial, ByteBuf content) {
        // ACK first — alarm packets follow the standard ACK protocol
        ctx.writeAndFlush(packetEncoder.buildAck(PacketType.ALARM, serial));

        Boolean registered = ctx.channel().attr(ChannelKeys.REGISTERED_KEY).get();
        if (registered == null || !registered) {
            log.debug("Dropping alarm packet from unregistered channel id={}", ctx.channel().id());
            return;
        }
        String imei = ctx.channel().attr(ChannelKeys.IMEI_KEY).get();
        UUID orgId = ctx.channel().attr(ChannelKeys.ORG_ID_KEY).get();
        if (imei == null || orgId == null) return;

        byte[] raw = new byte[content.readableBytes()];
        content.getBytes(content.readerIndex(), raw);

        ingestExecutor.execute(() -> {
            try {
                io.netty.buffer.ByteBuf detached = io.netty.buffer.Unpooled.wrappedBuffer(raw);
                LocationData loc = packetDecoder.decodeAlarm(detached);
                loc.setImei(imei);
                loc.setOrgId(orgId);
                loc.setRawPayload(raw);
                // Persist as a location row + run geofence/trip evaluation
                locationService.saveAndBroadcast(loc);

                // Then translate the alarm code into a domain alarm
                com.webinnovation.pingpath.domain.enums.AlarmType type =
                        switch (loc.getAlarmCode()) {
                            case 1 -> com.webinnovation.pingpath.domain.enums.AlarmType.SHOCK;
                            case 2 -> com.webinnovation.pingpath.domain.enums.AlarmType.POWER_CUT;
                            case 3 -> com.webinnovation.pingpath.domain.enums.AlarmType.LOW_BATTERY;
                            case 4 -> com.webinnovation.pingpath.domain.enums.AlarmType.SOS;
                            default -> null;
                        };
                if (type == null) return;

                com.webinnovation.pingpath.domain.enums.AlarmSeverity sev =
                        (type == com.webinnovation.pingpath.domain.enums.AlarmType.SOS
                                || type == com.webinnovation.pingpath.domain.enums.AlarmType.POWER_CUT)
                                ? com.webinnovation.pingpath.domain.enums.AlarmSeverity.CRITICAL
                                : com.webinnovation.pingpath.domain.enums.AlarmSeverity.WARNING;

                alarmService.raise(orgId, imei, type, sev,
                        loc.getTimestamp(), loc.getLatitude(), loc.getLongitude(),
                        java.util.Map.of("source", "device", "alarmCode", loc.getAlarmCode()));
            } catch (Exception e) {
                log.error("Alarm decode/persist failed for imei={}: {}", imei, e.getMessage(), e);
            }
        });
    }

    private void handleCommandReply(ChannelHandlerContext ctx, ByteBuf content) {
        // 0x15 reply layout: [server-flag:4][len:1][content...]
        if (content.readableBytes() < 5) return;
        byte[] flagBytes = new byte[4];
        content.readBytes(flagBytes);
        int serverFlag = ((flagBytes[0] & 0xFF) << 24)
                | ((flagBytes[1] & 0xFF) << 16)
                | ((flagBytes[2] & 0xFF) << 8)
                | (flagBytes[3] & 0xFF);
        int len = content.readUnsignedByte();
        len = Math.min(len, content.readableBytes());
        byte[] reply = new byte[len];
        content.readBytes(reply);
        deviceCommandService.completeReply(serverFlag, new String(reply, java.nio.charset.StandardCharsets.US_ASCII));
    }

    private void handleHeartbeat(ChannelHandlerContext ctx, int serial) {
        ctx.writeAndFlush(packetEncoder.buildAck(PacketType.HEARTBEAT, serial));
        String imei = ctx.channel().attr(ChannelKeys.IMEI_KEY).get();
        if (imei != null) {
            ingestExecutor.execute(() -> deviceService.markOnline(imei));
        }
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        log.warn("Channel exception (id={}): {}", ctx.channel().id(), cause.getMessage());
        ctx.close();
    }
}
