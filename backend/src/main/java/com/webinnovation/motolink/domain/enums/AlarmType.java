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
    /** Vehicle's ACC was on during a window an org-defined rule designated as forbidden. */
    CURFEW_VIOLATION
}
