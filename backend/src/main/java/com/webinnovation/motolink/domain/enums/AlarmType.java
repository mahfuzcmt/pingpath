package com.webinnovation.motolink.domain.enums;

public enum AlarmType {
    SOS,
    POWER_CUT,
    SHOCK,
    OVERSPEED,
    GEOFENCE_ENTER,
    GEOFENCE_EXIT,
    COLLISION,
    ACC_ON,
    ACC_OFF,
    LOW_BATTERY,
    /** External voltage low (0x0E) - vehicle battery/power supply low. */
    EXTERNAL_LOW_VOLTAGE,
    /** Device removal alarm (0x13) - tracker detached from mounting. */
    REMOVE,
    /** Door open/close alarm (0x14). */
    DOOR,
    /** Urgent/harsh acceleration (0xF0). */
    URGENT_ACCELERATION,
    /** Rapid/harsh deceleration (0xF1). */
    URGENT_DECELERATION,
    /** Vehicle's ACC was on during a window an org-defined rule designated as forbidden. */
    CURFEW_VIOLATION
}
