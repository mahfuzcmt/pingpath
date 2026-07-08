# CLAUDE.md — MotoLink Vehicle GPS Tracking Platform

> This file is the canonical specification for building the Vehicle GPS Tracking Platform with Claude Code.
> When working in this codebase, Claude Code MUST read this file first and align all changes to its decisions.
> Updates to architecture, data model, or stack must be reflected here in the same PR.

---

## 1. Project Overview

**Product Name (brand):** MotoLink

**Naming (post-rebrand, 2026-07-03):** Code identifiers are now **`motolink`** — Java package `com.webinnovation.motolink`, main class `MotoLinkApplication`, Maven artifact/`finalName` `motolink`, `spring.application.name`, config-property prefix `motolink.*`, frontend package `motolink-frontend`. **Deliberately left as `pingpath`** (runtime/infra, to avoid breaking the live VPS): the Postgres database name + user (`pingpath`/`pingpath_dev`), Docker container/volume names, `PINGPATH_*` env-var names, domains (`api.pingpath.com`, `admin@pingpath.local`), and the Flyway migration files V1–V5 (untouched — editing an applied migration changes its checksum and breaks Flyway validation on the running DB). If/when those get renamed, it requires a coordinated VPS DB migration + redeploy. The repo directory is still named `pingpath/` (the working-copy path); renaming it is optional and cosmetic.

**Product:** Multi-tenant SaaS platform for vehicle GPS fleet tracking, built around the Concox GT06 family of cellular GPS hardware trackers. Targets the Bangladesh market initially: motorbike anti-theft, ride-sharing fleets, delivery riders (Pathao/Foodpanda partners), CNG/taxi operators, school van services, logistics fleets. Native **Android + iOS** apps serve professional and corporate fleet clients (see §16 Phase 5).

**Owner:** Mahfuz Ahmed — Web Innovation
**Region:** Bangladesh (primary), with architecture that can serve other South Asian markets without rework.

**Business model:**
- One-time hardware sale: ৳3,000–8,000 per device + installation (benchmark: AutoNemo ৳4,000–9,000; see §23)
- Recurring SaaS subscription: ৳200–500/month per vehicle
- Tiered plans: Basic (live tracking + history), Pro (geofencing + alerts), Enterprise (API + multi-user + custom reports)

**Why this exists:**
- Existing Bangladesh GPS providers (FleetGuru, Tracker BD, Sebadex) ship dated UIs and English-only dashboards
- The market leader, **AutoNemo, is a GPSWox white-label reseller** (Android pkg `com.autonemovtsgpswox.track`) — they rent a generic platform and cannot deeply customize it. MotoLink owns its full stack, which is the core competitive edge. See `docs/COMPETITIVE_ANALYSIS.md`.
- Motorbike anti-theft is an underserved high-volume segment in Dhaka
- bKash/Nagad billing integration is missing from international platforms (Wialon, GPSWox)
- Bengali UI is required for last-mile workshop and end-user adoption

---

## 2. Tech Stack — Locked Decisions

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Backend language | Java | 21 (LTS) | Aligns with team expertise, virtual threads for connection scaling |
| Backend framework | Spring Boot | 3.3.4 | Modern, AOT support, latest virtual thread integration |
| TCP server | Netty | 4.1.114.Final | Industry standard for binary protocol servers |
| Database | PostgreSQL | 16.x | Reliable, mature; PostGIS for geospatial |
| Geospatial extension | PostGIS | 3.4 | Geofencing, distance queries, spatial indexes |
| Cache + pub/sub | Redis | 7.x | Last-known position cache, location event broadcasting |
| Message queue (later phase) | RabbitMQ | 3.13.x | Only when scaling beyond ~10K vehicles |
| Migrations | Flyway | 10.x | Versioned schema, no Liquibase XML |
| Auth | Spring Security + JJWT | 0.12.6 | Stateless JWT, refresh tokens |
| Frontend framework | Next.js | 15.x (App Router) | SSR + RSC, file-based routing |
| Frontend language | TypeScript | 5.x (strict mode) | No `any` allowed |
| UI framework | Tailwind CSS | 3.4.x | Utility-first, no design system framework |
| Map library | Mapbox GL JS | 3.x | Best vector rendering, supports custom styles |
| WebSocket client | @stomp/stompjs | 7.x | STOMP over WebSocket, matches Spring's broker |
| Mobile (Phase 5) | React Native + Expo | 51.x | Cross-platform end-user app |
| Container | Docker | 24+ | Local dev + production parity |
| Cloud | AWS Mumbai (ap-south-1) | — | Lowest latency to Bangladesh; consider OCI later for cost |
| CI/CD | GitHub Actions | — | Test, build, push image, deploy |
| Logging | Logback + JSON | — | Structured logs to CloudWatch |
| Monitoring | Prometheus + Grafana | — | Self-hosted on AWS EC2 |

**Forbidden choices** (do not introduce without updating this doc):
- Hibernate / JPA for hot-write paths — use `JdbcTemplate` for location inserts (orders of magnitude faster for time-series writes)
- MongoDB — PostgreSQL with PostGIS handles our scale
- Kafka — RabbitMQ is sufficient until proven otherwise
- React Router or Pages Router on the frontend — App Router only
- CSS-in-JS — Tailwind only
- Material UI / Ant Design / Chakra — custom Tailwind components only

---

## 3. Architecture

### 3.1 High-Level Components

```
┌─────────────────────┐
│ GT06 Vehicle Device │  Concox GT06N / Teltonika / Coban
│ (cellular SIM)      │
└──────────┬──────────┘
           │ TCP binary (port 5023)
           ▼
┌─────────────────────┐
│ Netty TCP Server    │  GT06 frame decoder + protocol handler
│ (in Spring Boot)    │  Sends ACK responses synchronously
└──────────┬──────────┘
           │ Decoded LocationData / AlarmData
           ▼
┌─────────────────────┐
│ Spring Boot Service │  LocationService → save + publish
│ Layer               │  AlarmService, GeofenceService, TripService
└──────┬───────┬──────┘
       │       │
       ▼       ▼
  ┌────────┐ ┌──────┐
  │PG +    │ │Redis │  PostGIS for cold storage + geofences
  │PostGIS │ │      │  Redis for hot cache + pub/sub
  └────────┘ └──┬───┘
                │ pub/sub: "location-events"
                ▼
         ┌─────────────┐
         │ WebSocket   │  STOMP over SockJS
         │ Gateway     │  Filters by org_id
         └──────┬──────┘
                │ wss://
                ▼
         ┌─────────────┐
         │ Next.js     │  Mapbox GL JS
         │ Dashboard   │  React Native (Phase 5)
         └─────────────┘
```

### 3.2 Critical Data Flow Rules

1. **Every location packet that passes CRC** is persisted to `locations` table. No filtering at ingestion.
2. **Every location** writes to Redis hot cache `device:last:{imei}` with 24-hour TTL.
3. **Every location** publishes to Redis channel `location-events` for WebSocket fanout.
4. **Side effects** (geofence checks, alarm dispatch, trip detection) hang off the same event — never block the ingestion path.
5. **WebSocket fanout filters by org_id** at the gateway. Never broadcast to all clients and filter on the browser.
6. **TCP ACKs are synchronous and immediate** — GT06 devices disconnect after 5 seconds without an ACK, causing reconnect storms.

### 3.3 Network Topology

- Netty TCP server: port `5023` (TCP, public, no TLS — GT06 doesn't support TLS)
- REST API: port `8080` (HTTPS via Nginx in prod)
- WebSocket: port `8080` (same backend, different path `/ws`)
- Frontend: port `3000` (dev), behind CloudFront in prod
- PostgreSQL: port `5432` (private subnet only)
- Redis: port `6379` (private subnet only)

---

## 4. Project Structure

```
pingpath/
├── CLAUDE.md                           # This file
├── README.md                           # Quick start
├── docker-compose.yml                  # Local dev orchestration
├── docker-compose.prod.yml             # Production override
├── .env.example
├── .github/workflows/
│   ├── backend.yml                     # CI for backend
│   └── frontend.yml                    # CI for frontend
│
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   ├── src/main/java/com/webinnovation/pingpath/
│   │   ├── PingPathApplication.java
│   │   │
│   │   ├── config/
│   │   │   ├── RedisConfig.java        # Pub/sub listener, RedisTemplate
│   │   │   ├── SecurityConfig.java     # JWT filter, endpoint rules
│   │   │   ├── WebSocketConfig.java    # STOMP broker registration
│   │   │   ├── NettyServerConfig.java  # Bootstrap, channel pipeline
│   │   │   ├── JacksonConfig.java      # Date/time module, snake_case
│   │   │   └── AsyncConfig.java        # Virtual thread executor
│   │   │
│   │   ├── netty/
│   │   │   ├── NettyServer.java        # Lifecycle: start, stop
│   │   │   ├── Gt06FrameDecoder.java   # Splits TCP stream into frames
│   │   │   ├── Gt06Handler.java        # Dispatches to protocol handlers
│   │   │   └── ChecksumUtil.java       # CRC-ITU implementation
│   │   │
│   │   ├── protocol/
│   │   │   ├── PacketType.java         # Enum: LOGIN, LOCATION_*, HEARTBEAT, ALARM, RFID, COMMAND_REPLY
│   │   │   ├── LoginPacket.java        # 0x01
│   │   │   ├── LocationPacket.java     # 0x12, 0x22, 0x32, 0xA0 (variant in field)
│   │   │   ├── HeartbeatPacket.java    # 0x13
│   │   │   ├── AlarmPacket.java        # 0x16
│   │   │   ├── RfidPacket.java         # 0x17
│   │   │   ├── CommandReplyPacket.java # 0x15
│   │   │   ├── PacketDecoder.java      # Routes by protocol number
│   │   │   ├── PacketEncoder.java      # Builds 0x80 server commands
│   │   │   └── AlarmType.java          # Enum mapping 0x01 SOS, 0xF2 Collision, etc
│   │   │
│   │   ├── domain/                     # POJOs / records, no JPA entities
│   │   │   ├── Organization.java
│   │   │   ├── User.java
│   │   │   ├── Device.java
│   │   │   ├── Location.java
│   │   │   ├── Alarm.java
│   │   │   ├── Geofence.java
│   │   │   ├── Trip.java
│   │   │   ├── Subscription.java
│   │   │   └── enums/
│   │   │       ├── DeviceStatus.java   # ONLINE, OFFLINE, NEVER_CONNECTED
│   │   │       ├── UserRole.java       # SUPER_ADMIN, ORG_ADMIN, ORG_USER
│   │   │       └── PlanTier.java       # BASIC, PRO, ENTERPRISE
│   │   │
│   │   ├── repository/                 # JdbcTemplate-based DAOs
│   │   │   ├── DeviceRepository.java
│   │   │   ├── LocationRepository.java
│   │   │   ├── AlarmRepository.java
│   │   │   ├── GeofenceRepository.java
│   │   │   ├── TripRepository.java
│   │   │   ├── OrganizationRepository.java
│   │   │   ├── UserRepository.java
│   │   │   └── SubscriptionRepository.java
│   │   │
│   │   ├── service/
│   │   │   ├── LocationService.java    # save + publish (HOT PATH)
│   │   │   ├── DeviceService.java      # provision, status, ownership lookup
│   │   │   ├── AlarmService.java       # dispatch SMS/push
│   │   │   ├── GeofenceService.java    # ST_Contains evaluation
│   │   │   ├── TripService.java        # ACC on/off → trip records
│   │   │   ├── AuthService.java        # login, JWT issue, refresh
│   │   │   ├── OrgService.java         # CRUD orgs, user invites
│   │   │   ├── ReportService.java      # daily / monthly PDF + Excel
│   │   │   ├── BillingService.java     # bKash subscription
│   │   │   ├── SmsService.java         # SSL Wireless integration
│   │   │   ├── PushService.java        # Expo Push Service (relays FCM/APNs)
│   │   │   ├── DeviceProvisioningService.java  # SMS-based GT06 config
│   │   │   └── DeviceCommandService.java       # 0x80 packet builder + dispatcher
│   │   │
│   │   ├── api/                        # REST controllers
│   │   │   ├── AuthController.java
│   │   │   ├── DeviceController.java
│   │   │   ├── LocationController.java
│   │   │   ├── GeofenceController.java
│   │   │   ├── TripController.java
│   │   │   ├── AlarmController.java
│   │   │   ├── ReportController.java
│   │   │   ├── OrgController.java
│   │   │   ├── BillingController.java
│   │   │   └── HealthController.java
│   │   │
│   │   ├── dto/                        # Request/response records
│   │   │   ├── auth/
│   │   │   ├── device/
│   │   │   ├── location/
│   │   │   ├── geofence/
│   │   │   ├── trip/
│   │   │   ├── alarm/
│   │   │   └── common/
│   │   │
│   │   ├── ws/
│   │   │   ├── LocationFanout.java     # Redis sub → STOMP topic
│   │   │   └── AlarmFanout.java        # Same for alarms
│   │   │
│   │   ├── security/
│   │   │   ├── JwtFilter.java
│   │   │   ├── JwtService.java
│   │   │   ├── TenantContext.java      # ThreadLocal org_id
│   │   │   └── TenantInterceptor.java  # Sets context per request
│   │   │
│   │   ├── job/
│   │   │   ├── DeviceStatusJob.java    # Mark offline if no heartbeat 10min
│   │   │   ├── ReportGenerationJob.java
│   │   │   ├── SubscriptionRenewalJob.java
│   │   │   └── DataRetentionJob.java   # Archive locations > 90 days
│   │   │
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   ├── DomainException.java
│   │   │   ├── NotFoundException.java
│   │   │   └── ForbiddenException.java
│   │   │
│   │   └── util/
│   │       ├── HexUtil.java
│   │       ├── DateTimeUtil.java
│   │       └── BangladeshLocale.java
│   │
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   ├── application-prod.yml
│   │   ├── logback-spring.xml
│   │   └── db/migration/
│   │       ├── V1__initial_schema.sql
│   │       ├── V2__seed_data.sql
│   │       ├── V3__add_geofence_tables.sql
│   │       ├── V4__add_trips.sql
│   │       └── V5__add_subscriptions.sql
│   │
│   └── src/test/java/com/webinnovation/pingpath/
│       ├── netty/
│       │   ├── Gt06FrameDecoderTest.java
│       │   └── Gt06HandlerTest.java
│       ├── protocol/
│       │   └── PacketDecoderTest.java
│       └── service/
│           ├── LocationServiceTest.java
│           └── GeofenceServiceTest.java
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── .env.local.example
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # Landing → redirect to /login or /dashboard
│   │   │   ├── globals.css
│   │   │   │
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx          # App shell with sidebar
│   │   │   │   ├── page.tsx            # Live fleet map (default view)
│   │   │   │   ├── devices/
│   │   │   │   │   ├── page.tsx        # Device list
│   │   │   │   │   └── [id]/page.tsx   # Device detail + trip history
│   │   │   │   ├── geofences/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── trips/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── alarms/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   ├── page.tsx        # Org settings
│   │   │   │   │   ├── users/page.tsx  # Team management
│   │   │   │   │   └── billing/page.tsx # bKash subscription
│   │   │   │   └── admin/              # Super admin only
│   │   │   │       ├── orgs/page.tsx
│   │   │   │       └── devices/page.tsx
│   │   │   │
│   │   │   └── api/                    # Next.js API routes (proxy to backend)
│   │   │       └── proxy/[...path]/route.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                     # Atoms: Button, Input, Card, etc.
│   │   │   ├── map/
│   │   │   │   ├── FleetMap.tsx        # Live map with markers
│   │   │   │   ├── VehicleMarker.tsx
│   │   │   │   ├── TripPlayback.tsx    # Replay historical trips
│   │   │   │   └── GeofenceEditor.tsx
│   │   │   ├── device/
│   │   │   │   ├── DeviceList.tsx
│   │   │   │   ├── DeviceCard.tsx
│   │   │   │   ├── DeviceProvisioning.tsx
│   │   │   │   └── DeviceCommandPanel.tsx  # Cut fuel, query, etc.
│   │   │   ├── alarm/
│   │   │   │   ├── AlarmList.tsx
│   │   │   │   └── AlarmBanner.tsx
│   │   │   └── shell/
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Topbar.tsx
│   │   │       └── LanguageToggle.tsx  # Bengali / English
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                  # Axios instance, interceptors
│   │   │   ├── ws.ts                   # STOMP client
│   │   │   ├── auth.ts                 # JWT storage, refresh
│   │   │   ├── i18n.ts                 # Bengali / English strings
│   │   │   ├── format.ts               # Numbers, dates in BD locale
│   │   │   └── mapbox.ts               # Token, default style, helpers
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useDevices.ts
│   │   │   ├── useLiveLocations.ts
│   │   │   └── useGeofences.ts
│   │   │
│   │   ├── types/
│   │   │   ├── api.ts                  # API response types
│   │   │   └── domain.ts               # Domain types matching backend
│   │   │
│   │   └── styles/
│   │       └── (additional Tailwind layers if needed)
│   │
│   └── public/
│       ├── logo.svg
│       └── favicon.ico
│
├── mobile/                             # Phase 5 — React Native end-user app
│   └── (built later)
│
├── infra/
│   ├── nginx/
│   │   └── nginx.conf
│   ├── terraform/                      # AWS infrastructure as code
│   │   ├── main.tf
│   │   ├── ec2.tf
│   │   ├── rds.tf
│   │   ├── elasticache.tf
│   │   └── networking.tf
│   └── ansible/                        # Server config (alternative)
│       └── playbook.yml
│
├── scripts/
│   ├── seed_dev_data.sql
│   ├── simulate_device.py              # Python GT06 device simulator for testing
│   └── load_test.py                    # 1000 simulated devices
│
└── docs/
    ├── ARCHITECTURE.md
    ├── GT06_PROTOCOL.md                # Annotated from Concox doc
    ├── API.md                           # Full REST API reference
    ├── DEPLOYMENT.md
    ├── BANGLADESH_INTEGRATIONS.md      # bKash, SSL Wireless, APNs
    └── DEVICE_PROVISIONING.md          # Workshop technician guide (Bengali + English)
```

---

## 5. Database Schema

All tables use UUID primary keys (`gen_random_uuid()`), `created_at` and `updated_at` timestamps, and explicit `org_id` for multi-tenant filtering.

### 5.1 Core Tables

```sql
-- ============================================================
-- V1__initial_schema.sql
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----- Organizations (tenants) -----
CREATE TABLE organizations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    slug          VARCHAR(100) UNIQUE NOT NULL,
    plan_tier     VARCHAR(50) NOT NULL DEFAULT 'BASIC',
    status        VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, SUSPENDED, CANCELLED
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address       TEXT,
    locale        VARCHAR(10) DEFAULT 'bn-BD',
    timezone      VARCHAR(50) DEFAULT 'Asia/Dhaka',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----- Users -----
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255),
    role          VARCHAR(50) NOT NULL DEFAULT 'ORG_USER', -- SUPER_ADMIN, ORG_ADMIN, ORG_USER
    is_active     BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org ON users(org_id);

-- ----- Devices -----
CREATE TABLE devices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    imei            VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(255),
    sim_msisdn      VARCHAR(20),                 -- SIM phone number
    sim_iccid       VARCHAR(30),                 -- SIM ICCID
    vehicle_plate   VARCHAR(50),
    vehicle_type    VARCHAR(50),                 -- MOTORBIKE, CAR, TRUCK, CNG, BUS
    protocol        VARCHAR(20) NOT NULL DEFAULT 'GT06',
    protocol_variant VARCHAR(10),                -- V1.8, V3, V4, 4G
    model           VARCHAR(100),                -- Concox GT06N etc.
    status          VARCHAR(50) NOT NULL DEFAULT 'NEVER_CONNECTED',  -- ONLINE, OFFLINE, NEVER_CONNECTED
    last_seen_at    TIMESTAMPTZ,
    last_location   GEOGRAPHY(POINT, 4326),
    last_speed      INTEGER,
    last_course     INTEGER,
    last_voltage_mv INTEGER,
    icon_color      VARCHAR(20) DEFAULT '#E8900A',
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_devices_org ON devices(org_id);
CREATE INDEX idx_devices_imei ON devices(imei);
CREATE INDEX idx_devices_status ON devices(org_id, status);

-- ----- Locations (time-series) -----
CREATE TABLE locations (
    id            BIGSERIAL PRIMARY KEY,
    device_imei   VARCHAR(20) NOT NULL,
    org_id        UUID NOT NULL,                  -- denormalized for query speed
    ts            TIMESTAMPTZ NOT NULL,
    received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    geom          GEOGRAPHY(POINT, 4326) NOT NULL,
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    speed         INTEGER NOT NULL DEFAULT 0,     -- km/h
    course        INTEGER NOT NULL DEFAULT 0,     -- 0-360 degrees
    altitude      INTEGER,
    satellites    INTEGER,
    valid         BOOLEAN NOT NULL DEFAULT true,  -- GPS fix valid
    acc_on        BOOLEAN,                        -- Ignition on/off
    voltage_mv    INTEGER,                         -- External voltage in millivolts
    mileage_m     BIGINT,                          -- Cumulative meters
    raw_payload   BYTEA                            -- Optional: store raw frame for debugging
);

CREATE INDEX idx_locations_device_ts ON locations(device_imei, ts DESC);
CREATE INDEX idx_locations_org_ts ON locations(org_id, ts DESC);
CREATE INDEX idx_locations_geom ON locations USING GIST(geom);

-- Partition by month for retention/performance (optional Phase 2)
-- ALTER TABLE locations ... PARTITION BY RANGE (ts);

-- ----- Alarms -----
CREATE TABLE alarms (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        UUID NOT NULL,
    device_imei   VARCHAR(20) NOT NULL,
    type          VARCHAR(50) NOT NULL,           -- SOS, POWER_CUT, SHOCK, OVERSPEED, GEOFENCE_ENTER, GEOFENCE_EXIT, COLLISION, ACC_ON, ACC_OFF
    severity      VARCHAR(20) NOT NULL,           -- INFO, WARNING, CRITICAL
    ts            TIMESTAMPTZ NOT NULL,
    geom          GEOGRAPHY(POINT, 4326),
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    acknowledged  BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    metadata      JSONB DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alarms_org_ts ON alarms(org_id, ts DESC);
CREATE INDEX idx_alarms_device ON alarms(device_imei, ts DESC);
CREATE INDEX idx_alarms_unack ON alarms(org_id, acknowledged, ts DESC) WHERE acknowledged = false;

-- ----- Geofences -----
CREATE TABLE geofences (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    type          VARCHAR(20) NOT NULL,           -- CIRCLE, POLYGON
    geom          GEOGRAPHY NOT NULL,             -- Polygon for both (circle = polygon approximation)
    radius_m      INTEGER,                         -- Only for CIRCLE type
    center        GEOGRAPHY(POINT, 4326),         -- Only for CIRCLE type
    color         VARCHAR(20) DEFAULT '#0F2742',
    notify_on     VARCHAR(20) NOT NULL DEFAULT 'BOTH',  -- ENTER, EXIT, BOTH
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_geofences_org ON geofences(org_id) WHERE is_active = true;
CREATE INDEX idx_geofences_geom ON geofences USING GIST(geom) WHERE is_active = true;

-- Many-to-many: which devices are watched by which geofences
CREATE TABLE geofence_devices (
    geofence_id   UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    device_imei   VARCHAR(20) NOT NULL,
    PRIMARY KEY (geofence_id, device_imei)
);

-- Track current state to fire enter/exit transitions (no double-firing)
CREATE TABLE geofence_states (
    geofence_id   UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    device_imei   VARCHAR(20) NOT NULL,
    is_inside     BOOLEAN NOT NULL,
    last_change_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (geofence_id, device_imei)
);

-- ----- Trips -----
CREATE TABLE trips (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        UUID NOT NULL,
    device_imei   VARCHAR(20) NOT NULL,
    started_at    TIMESTAMPTZ NOT NULL,
    ended_at      TIMESTAMPTZ,
    start_geom    GEOGRAPHY(POINT, 4326),
    end_geom      GEOGRAPHY(POINT, 4326),
    distance_m    INTEGER NOT NULL DEFAULT 0,
    duration_s    INTEGER,
    max_speed     INTEGER NOT NULL DEFAULT 0,
    avg_speed     INTEGER NOT NULL DEFAULT 0,
    idle_time_s   INTEGER NOT NULL DEFAULT 0,
    status        VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_org_started ON trips(org_id, started_at DESC);
CREATE INDEX idx_trips_device_started ON trips(device_imei, started_at DESC);
CREATE INDEX idx_trips_in_progress ON trips(device_imei) WHERE status = 'IN_PROGRESS';

-- ----- Subscriptions / Billing -----
CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_imei     VARCHAR(20) NOT NULL,
    plan_tier       VARCHAR(50) NOT NULL,
    monthly_price_bdt INTEGER NOT NULL,
    started_at      DATE NOT NULL,
    next_due_at     DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, GRACE, SUSPENDED, CANCELLED
    auto_renew      BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    org_id          UUID NOT NULL,
    amount_bdt      INTEGER NOT NULL,
    method          VARCHAR(20) NOT NULL,        -- BKASH, NAGAD, BANK, CASH
    bkash_trx_id    VARCHAR(100),                 -- bKash transaction ID
    nagad_ref       VARCHAR(100),
    status          VARCHAR(20) NOT NULL,        -- PENDING, SUCCESS, FAILED, REFUNDED
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----- Audit log -----
CREATE TABLE audit_log (
    id            BIGSERIAL PRIMARY KEY,
    org_id        UUID,
    user_id       UUID,
    action        VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id   VARCHAR(100),
    metadata      JSONB,
    ip_address    INET,
    user_agent    TEXT,
    ts            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org_ts ON audit_log(org_id, ts DESC);
```

### 5.2 Schema Conventions

- **Always include `org_id`** on tenant-scoped tables, even when joinable through another table. Denormalization buys query speed.
- **All timestamps are `TIMESTAMPTZ`** stored in UTC. Display layer converts to `Asia/Dhaka`.
- **Geographic coordinates** use SRID 4326 (WGS84) — the GPS standard.
- **Use `geography` not `geometry`** for storage — automatic distance in meters, no projection issues.
- **Speed in km/h, distance in meters, voltage in millivolts** — integer fields, no floats for these.

---

## 6. GT06 Protocol Implementation

### 6.1 Frame Structure

The protocol has **two frame variants** that share semantics but differ in the length field:

| Variant | Start bytes | Length field | Usage |
|---|---|---|---|
| Standard | `0x78 0x78` | 1 byte | Login, location, heartbeat, alarm, RFID, server commands |
| Extended | `0x79 0x79` | 2 bytes | ICCID upload, voltage data, photos (some variants) |

All frames end with `0x0D 0x0A`.

```
[Start:2] [Length:1or2] [ProtocolNumber:1] [Content:N] [Serial:2] [CRC-ITU:2] [Stop:2]
```

### 6.2 Protocol Numbers — Complete List

| Hex | Type | Direction | Variant Notes |
|---|---|---|---|
| `0x01` | Login | Device → Server | First packet after TCP connect |
| `0x12` | Location V1.8 | Device → Server | Lat/lng = (deg×60 + min) × 30000 |
| `0x22` | Location V3 | Device → Server | Lat/lng = raw / 1800000.0; includes ACC, mileage |
| `0x32` | Location V4 | Device → Server | V3 + 4-byte cell ID, voltage, ACC time |
| `0xA0` | Location 4G | Device → Server | 4-byte LAC, 8-byte cell ID, 1-or-2 byte MNC |
| `0x13` | Heartbeat / Status | Device → Server | Sent every ~3 minutes |
| `0x16` | Alarm | Device → Server | Location + status + alarm code |
| `0x17` | RFID swipe | Device → Server | Driver identification |
| `0x15` | Command reply | Device → Server | Response to 0x80 server command |
| `0x80` | Server command | Server → Device | DYD, HFYD, DWXX, SETUP, etc. |
| `0x1A` | Address query | Device → Server | Phone-initiated |

### 6.3 Coordinate Encoding — CRITICAL

This is the #1 source of bugs. **Different protocol variants use different formulas.**

**V1.8 (0x12):**
```
raw = readUInt32(buf)
decimal = raw / 30000.0      // result is in minutes
degrees = floor(decimal / 60) + (decimal % 60) / 60.0
```

**V3 / V4 / 4G (0x22, 0x32, 0xA0):**
```
raw = readUInt32(buf)
degrees = raw / 1800000.0    // direct division
```

**Sign:** Course-status field, byte 1 — the hemisphere bits are **asymmetric** (per the Concox doc and Traccar's `Gt06ProtocolDecoder`; corrected 2026-07-08, commit `ef669db` fixed the code but not this doc):
- **Latitude, bit 10 (0x0400): 0 = South, 1 = North** — a Dhaka device sends 1
- **Longitude, bit 11 (0x0800): 0 = East, 1 = West** — a Dhaka device sends 0

Getting this symmetric ("bit set = N/E") puts every Bangladesh vehicle at (23.78, −90.42) — the Gulf of Mexico.

### 6.4 Login Handler (0x01) — Detailed

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class LoginHandler {

    private final DeviceService deviceService;
    private final PacketEncoder encoder;

    public void handle(ChannelHandlerContext ctx, ByteBuf frame, int serial) {
        // Frame is positioned right after protocol number byte
        // Next 8 bytes are the BCD-encoded IMEI (15 digits packed into 8 bytes with leading 0 nibble)
        byte[] imeiBytes = new byte[8];
        frame.readBytes(imeiBytes);
        String imei = decodeBcdImei(imeiBytes);

        log.info("Login from IMEI={} channel={}", imei, ctx.channel().id());

        // Always ACK first — even if device is unknown
        ByteBuf ack = encoder.buildLoginAck(serial);
        ctx.writeAndFlush(ack);

        // Look up org
        Optional<Device> deviceOpt = deviceService.findByImei(imei);
        if (deviceOpt.isEmpty()) {
            log.warn("Unregistered IMEI {} — keeping connection but flagging", imei);
            ctx.channel().attr(IMEI_KEY).set(imei);
            ctx.channel().attr(REGISTERED_KEY).set(false);
            // DO NOT disconnect — burns customer GPRS in reconnect loop
            return;
        }

        Device device = deviceOpt.get();
        ctx.channel().attr(IMEI_KEY).set(imei);
        ctx.channel().attr(ORG_ID_KEY).set(device.getOrgId());
        ctx.channel().attr(REGISTERED_KEY).set(true);

        deviceService.markOnline(imei);
    }

    private String decodeBcdImei(byte[] bcd) {
        StringBuilder sb = new StringBuilder(15);
        for (byte b : bcd) {
            sb.append((b >> 4) & 0x0F);
            sb.append(b & 0x0F);
        }
        return sb.length() > 15 ? sb.substring(sb.length() - 15) : sb.toString();
    }
}
```

### 6.5 Location Handler — Variant-Aware

```java
public LocationData decode(ByteBuf buf, int protocolNumber) {
    LocationData loc = new LocationData();
    loc.setTimestamp(decodeDateTime(buf));   // 6 bytes UTC

    int gpsByte = buf.readUnsignedByte();
    loc.setGpsInfoLength((gpsByte >> 4) & 0x0F);
    loc.setSatellites(gpsByte & 0x0F);

    long latRaw = buf.readUnsignedInt();
    long lonRaw = buf.readUnsignedInt();
    loc.setSpeed(buf.readUnsignedByte());

    int courseStatus = buf.readUnsignedShort();
    loc.setCourse(courseStatus & 0x03FF);
    loc.setValid((courseStatus & 0x1000) != 0);
    // Asymmetric hemisphere bits (see §6.3): lat bit CLEAR = south, lng bit SET = west
    boolean south = (courseStatus & 0x0400) == 0;
    boolean west  = (courseStatus & 0x0800) != 0;

    double lat, lon;
    if (protocolNumber == 0x12) {
        // V1.8: degrees-minutes encoding
        lat = (latRaw / 30000.0) / 60.0;
        lon = (lonRaw / 30000.0) / 60.0;
    } else {
        // V3, V4, 4G: direct division
        lat = latRaw / 1800000.0;
        lon = lonRaw / 1800000.0;
    }
    if (south) lat = -lat;
    if (west)  lon = -lon;
    loc.setLatitude(lat);
    loc.setLongitude(lon);

    // LBS (cell tower) data — variant differences for 4G
    if (protocolNumber == 0xA0) {
        // 4G: 2-byte MCC (high bit signals MNC length), 1-or-2 byte MNC, 4-byte LAC, 8-byte cell ID
        int mcc = buf.readUnsignedShort();
        boolean mncLong = (mcc & 0x8000) != 0;
        loc.setMcc(mcc & 0x7FFF);
        loc.setMnc(mncLong ? buf.readUnsignedShort() : buf.readUnsignedByte());
        loc.setLac((int) buf.readUnsignedInt());
        loc.setCellId(buf.readLong());
    } else {
        loc.setMcc(buf.readUnsignedShort());
        loc.setMnc(buf.readUnsignedByte());
        loc.setLac(buf.readUnsignedShort());
        loc.setCellId(read24BitInt(buf));
    }

    // V3/V4/4G additional fields
    if (protocolNumber == 0x22 || protocolNumber == 0x32 || protocolNumber == 0xA0) {
        loc.setAccOn(buf.readUnsignedByte() == 1);
        loc.setUploadMode(buf.readUnsignedByte());
        loc.setRealtimeFlag(buf.readUnsignedByte());
        loc.setMileageMeters(buf.readUnsignedInt() * 1000L);  // km → m
    }

    if (protocolNumber == 0x32 || protocolNumber == 0xA0) {
        loc.setVoltageMv(buf.readUnsignedShort() * 10);  // 0.01V → mV
    }
    if (protocolNumber == 0x32) {
        loc.setAccOnTimeSeconds(buf.readUnsignedInt());
        buf.skipBytes(2);  // reserved
    }

    return loc;
}
```

### 6.6 CRC-ITU (X.25 CRC-16)

**This is NOT standard CRC-16.** Use Traccar's exact implementation:

```java
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

    public static int crcItu(ByteBuf buf, int offset, int length) {
        int crc = 0xFFFF;
        for (int i = 0; i < length; i++) {
            crc = TABLE[((crc >> 8) ^ buf.getByte(offset + i)) & 0xFF] ^ (crc << 8);
        }
        return (~crc) & 0xFFFF;
    }
}
```

CRC is computed over: `[Length] [ProtocolNumber] [Content] [Serial]` — i.e. everything between the start bits and the CRC field itself.

### 6.7 Server Command Packets (0x80)

Used to send commands like cut fuel (`DYD`), restore fuel (`HFYD`), query address (`DWXX`).

```
[0x78 0x78] [Length] [0x80] [CmdLen:1] [ServerFlag:4] [CmdContent:M ASCII] [Serial:2] [CRC:2] [0x0D 0x0A]
```

**Important:** Command content is ASCII (e.g., `"DYD,000000#"`), CmdLen = 4 (server flag) + length of ASCII string.

### 6.8 Alarm Codes (from Concox doc, latter byte of Alarm/Language field)

```java
public enum AlarmType {
    NORMAL(0x00),
    SOS(0x01),
    POWER_CUT(0x02),
    SHOCK(0x03),
    OVERSPEED(0x06),
    GEOFENCE_OUT(0x09),
    EXTERNAL_LOW_VOLTAGE(0x0E),
    REMOVE(0x13),
    DOOR(0x14),
    BATTERY_LOW(0x19),
    URGENT_ACCELERATION(0xF0),
    URGENT_DECELERATION(0xF1),
    COLLISION(0xF2),
    ACC_ON(0xFE),
    ACC_OFF(0xFF);

    public final int code;
    AlarmType(int code) { this.code = code; }
}
```

---

## 7. Backend Service Contracts

### 7.1 LocationService (HOT PATH)

```java
public interface LocationService {
    /** Persist + cache + publish. Called from Netty handler thread — must be fast. */
    void saveAndBroadcast(LocationData loc);

    /** Most recent N locations for a device. */
    List<Location> getHistory(String imei, Instant from, Instant to, int limit);

    /** Last-known position from Redis hot cache. */
    Optional<Location> getLastKnown(String imei);

    /** All last-known positions for an org (for dashboard initial load). */
    List<Location> getAllLastKnown(UUID orgId);

    /** Locations within a bounding box — for map viewport queries. */
    List<Location> getInBoundingBox(UUID orgId, double minLat, double minLng,
                                    double maxLat, double maxLng, Instant since);
}
```

### 7.2 GeofenceService

```java
public interface GeofenceService {
    Geofence create(UUID orgId, GeofenceCreateRequest req);
    Geofence update(UUID orgId, UUID id, GeofenceUpdateRequest req);
    void delete(UUID orgId, UUID id);
    List<Geofence> listForOrg(UUID orgId);
    void assignToDevice(UUID orgId, UUID geofenceId, String imei);
    void unassignFromDevice(UUID orgId, UUID geofenceId, String imei);

    /** Called from LocationService after every save. Fires alarms on transitions. */
    void evaluate(LocationData loc);
}
```

`evaluate` queries for all geofences assigned to the device, runs `ST_Contains(geom, point)` for each, compares against the previous state in `geofence_states`, and fires `GEOFENCE_ENTER` / `GEOFENCE_EXIT` alarms only on transitions.

### 7.3 TripService

```java
public interface TripService {
    /** Called from LocationService after every save. Detects start/end. */
    void onLocation(Location loc, Device device);

    List<Trip> listForDevice(String imei, Instant from, Instant to);
    Trip getById(UUID orgId, UUID tripId);
    List<Location> getTripPoints(UUID orgId, UUID tripId);
}
```

**Trip detection rules:**
- **Start:** ACC transitions from off to on, OR speed > 5 km/h after 5+ minutes stationary
- **End:** ACC transitions from on to off AND speed = 0 for 3+ minutes, OR no movement for 10+ minutes
- **Distance:** sum of `ST_Distance` between consecutive points
- **Idle time:** time spent with speed=0 and ACC=on within the trip

### 7.4 DeviceProvisioningService

```java
public interface DeviceProvisioningService {
    /**
     * Sends GT06 SMS configuration to a SIM number.
     * Pushes commands one-by-one with 8-second delays via SMS gateway.
     */
    ProvisioningResult provision(String imei, String simMsisdn, ProvisioningConfig config);

    /** Wait for the device to call back with its first login packet. */
    boolean awaitFirstConnection(String imei, Duration timeout);
}

@Value
public class ProvisioningConfig {
    String adminPhone;       // SOS,A
    String apn;              // gpinternet, internet, blweb
    String serverHost;       // track.yourdomain.com
    int serverPort;          // 5023
    int gmtOffsetHours;      // 6 for Bangladesh
    int reportIntervalAccOn; // seconds, e.g. 30
    int reportIntervalAccOff; // seconds, e.g. 300
    String devicePassword;   // default 123456
}
```

The service generates these SMS commands in order:
```
SOS,A,{adminPhone}#
APN,{apn}#
SERVER,1,{serverHost},{serverPort},0#
GMT,E,{gmtOffsetHours},0#
TIMER,{accOn},{accOff}#
GPRS,ON#
RESET#
```

### 7.5 DeviceCommandService

Sends 0x80 packets to connected devices.

```java
public interface DeviceCommandService {
    CompletableFuture<String> cutFuel(String imei);             // DYD,{password}#
    CompletableFuture<String> restoreFuel(String imei);         // HFYD,{password}#
    CompletableFuture<String> queryAddress(String imei);        // DWXX,{password}#
    CompletableFuture<String> setOverspeedThreshold(String imei, int kmh);
    CompletableFuture<String> setCollisionAlarm(String imei, boolean enabled, int sensitivity);
    CompletableFuture<String> reboot(String imei);

    /** Generic raw command escape hatch. */
    CompletableFuture<String> sendRaw(String imei, String command, Duration timeout);
}
```

Uses an in-memory map of `imei → Channel` (populated by login handler) to find the open TCP connection. Tracks pending commands by serial number; resolves the future when the matching 0x15 reply arrives.

### 7.6 AlarmService

```java
public interface AlarmService {
    /** Triggered by AlarmPacket from device or by GeofenceService/TripService. */
    Alarm raise(UUID orgId, String imei, AlarmType type, double lat, double lng,
                Map<String, Object> metadata);

    void acknowledge(UUID orgId, UUID alarmId, UUID userId);
    List<Alarm> listForOrg(UUID orgId, AlarmFilter filter);

    /** Async: dispatch SMS + push + email per org notification settings. */
    void dispatch(Alarm alarm);
}
```

### 7.7 SmsService (SSL Wireless)

```java
public interface SmsService {
    /** Send transactional SMS. Returns provider message ID. */
    String send(String msisdn, String text);

    /** Bulk send (provisioning device commands). */
    Map<String, String> sendBulk(Map<String, String> recipientToText);
}
```

Implementation hits SSL Wireless API (`https://smsplus.sslwireless.com/api/v3/send-sms`).

---

## 8. REST API Specification

**Base URL:** `https://api.pingpath.com/api/v1`
**Auth:** `Authorization: Bearer {jwt}` on all endpoints except `/auth/*`

### 8.1 Auth

```
POST /auth/login              { email, password } → { accessToken, refreshToken, user, org }
POST /auth/refresh            { refreshToken } → { accessToken }
POST /auth/logout             {} → 204
POST /auth/forgot-password    { email } → 204
POST /auth/reset-password     { token, newPassword } → 204
GET  /auth/me                 → { user, org }
```

### 8.2 Organizations & Users

```
GET    /orgs/me               → { id, name, plan, ... }
PATCH  /orgs/me               { name, contact_email, ... } → { ... }

GET    /orgs/me/users         → User[]
POST   /orgs/me/users         { email, role, full_name } → User  (sends invite email)
PATCH  /orgs/me/users/:id     { role, is_active } → User
DELETE /orgs/me/users/:id     → 204
```

### 8.3 Devices

```
GET    /devices               ?status=ONLINE&q=plate → Device[]
POST   /devices               { imei, name, sim_msisdn, vehicle_plate, vehicle_type } → Device
GET    /devices/:imei         → Device
PATCH  /devices/:imei         { name, vehicle_plate, ... } → Device
DELETE /devices/:imei         → 204

POST   /devices/:imei/provision   { adminPhone, apn } → ProvisioningResult
POST   /devices/:imei/commands/cut-fuel       → { reply: "DYD=Success!" }
POST   /devices/:imei/commands/restore-fuel   → { reply: "HFYD=Success!" }
POST   /devices/:imei/commands/query-address  → { reply: "DWXX=Lat:..." }
POST   /devices/:imei/commands/raw            { command: "SPDADD,ON,10,2#" } → { reply }
```

### 8.4 Locations

```
GET /devices/:imei/locations/last           → Location
GET /devices/:imei/locations                ?from=ISO&to=ISO&limit=1000 → Location[]
GET /devices/locations/last                 → Location[]  (all devices, last-known)
GET /locations/in-bbox                      ?minLat&minLng&maxLat&maxLng&since=ISO → Location[]
```

### 8.5 Geofences

```
GET    /geofences                       → Geofence[]
POST   /geofences                       { name, type: "CIRCLE", center: {lat, lng}, radius_m, notify_on } → Geofence
POST   /geofences                       { name, type: "POLYGON", points: [{lat, lng}], notify_on } → Geofence
PATCH  /geofences/:id                   → Geofence
DELETE /geofences/:id                   → 204
POST   /geofences/:id/devices/:imei     → 204  (assign)
DELETE /geofences/:id/devices/:imei     → 204  (unassign)
```

### 8.6 Trips

```
GET /trips                          ?from=ISO&to=ISO&device=imei → Trip[]
GET /trips/:id                      → Trip
GET /trips/:id/points               → Location[]  (for replay)
```

### 8.7 Alarms

```
GET   /alarms                       ?type=&severity=&unack=true&from=&to= → Alarm[]
PATCH /alarms/:id/acknowledge       → Alarm
```

### 8.8 Reports

```
GET /reports/daily        ?date=YYYY-MM-DD&format=pdf|xlsx     → file
GET /reports/monthly      ?month=YYYY-MM&format=pdf|xlsx       → file
GET /reports/trip-summary ?device=imei&from=ISO&to=ISO         → file
```

### 8.9 Billing

```
GET  /billing/subscriptions               → Subscription[]
POST /billing/checkout/bkash              { subscription_id } → { redirect_url }
POST /billing/webhooks/bkash              (called by bKash on payment completion)
GET  /billing/invoices                    → Invoice[]
```

### 8.10 Standard Response Format

**Success:**
```json
{ "data": { ... } }   // or { "data": [ ... ], "page": { "total": 123, "limit": 50, "offset": 0 } }
```

**Error:**
```json
{ "error": { "code": "DEVICE_NOT_FOUND", "message": "...", "details": { ... } } }
```

HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable, 500 Internal.

---

## 9. WebSocket Specification

**Endpoint:** `wss://api.pingpath.com/ws` (STOMP over SockJS fallback)
**Auth:** JWT in `Authorization` header during STOMP CONNECT frame.

### 9.1 Server → Client Topics

```
/topic/org/{orgId}/locations     LocationEvent on every device location
/topic/org/{orgId}/alarms        AlarmEvent on every new alarm
/topic/org/{orgId}/devices/status DeviceStatusEvent on online/offline transitions
```

### 9.2 LocationEvent JSON

```json
{
  "imei": "864290061234567",
  "ts": "2026-05-07T10:23:45Z",
  "lat": 23.8103,
  "lng": 90.4125,
  "speed": 32,
  "course": 145,
  "valid": true,
  "accOn": true,
  "voltageMv": 12340
}
```

### 9.3 Subscription Authorization

Server-side `ChannelInterceptor` on STOMP SUBSCRIBE: parse the topic, extract `orgId`, compare against the authenticated user's `orgId`. Reject with `MessageDeliveryException` if mismatch.

---

## 10. Frontend — Page-by-Page Spec

### 10.1 Design Direction

**Aesthetic:** Mission-control / operations-center. Dark theme by default (less eye strain for fleet dispatchers, better contrast on map). Bangladesh tech feel.

**Color tokens (Tailwind config):**
```js
colors: {
  brand: {
    50:  '#FFF6E6',
    500: '#E8900A',  // primary orange (PingPath brand)
    900: '#7A4A05',
  },
  ink: {
    50:  '#F1F5F9',
    100: '#CBD5E1',
    400: '#64748B',
    900: '#0F2742',  // brand navy
    950: '#0A1928',  // background
  },
  alarm: { red: '#DC2626', amber: '#F59E0B', green: '#16A34A' },
}
```

**Typography:**
- Body: `Inter` 14px (weight 400), 13px on mobile
- Display headings: `Familjen Grotesk` (open source, distinctive)
- Monospace data (IMEI, plate, coords): `JetBrains Mono`
- Bengali UI: `Hind Siliguri` (Google Fonts, optimized for Bengali script)

### 10.2 `/login`

- Centered card on dark background with subtle map tile texture overlay
- Brand logo top
- Email + password fields, "remember me" toggle
- "Forgot password?" link
- Bengali / English toggle in top-right corner

### 10.3 `/dashboard` (default landing)

- Full-screen Mapbox map (dark style: `mapbox://styles/mapbox/dark-v11`)
- Left sidebar (collapsible): vehicle list with online/offline status dots, search filter
- Top bar: org name, alerts badge, language toggle, user menu
- Bottom-right: legend + map controls
- Vehicle markers: custom SVG arrow rotated by course, color = device.icon_color
- Click marker → side panel slides in showing device details, last 5 locations, "Send command" buttons
- Real-time updates via WebSocket; new positions animate over 800ms
- Initial load: REST `/devices/locations/last`, then subscribe WS

### 10.4 `/dashboard/devices`

- Table view: IMEI, name, vehicle plate, status, last seen, signal, speed, voltage
- Row actions: View on map, Edit, Provision, Send command, Suspend
- Top: "Add device" button → modal with form
- Filters: status, vehicle type, online/offline
- Bulk select for assigning to geofences

### 10.5 `/dashboard/devices/[id]`

- Three-panel layout: Map (left, 60%), Tabs (right, 40%)
- Tabs: Live, Trips, Alarms, Settings, Provision, Commands
- **Trips tab:** Date range picker, trip list, click trip to play back on map (animated polyline + moving marker, speed control)

### 10.6 `/dashboard/geofences`

- Map with all geofences drawn as polygons / circles
- Sidebar: list of geofences with toggles
- Top button: "Draw new" → enters drawing mode (click points for polygon, drag for circle)
- Each geofence has notification settings, assigned devices

### 10.7 `/dashboard/alarms`

- Filterable list: severity, type, date range, acknowledged
- Critical alarms (SOS, Collision) highlighted with pulsing red border
- Click alarm → opens map at location with timestamp
- "Acknowledge" button writes back to API

### 10.8 `/dashboard/reports`

- Pre-built reports: Daily fleet activity, Monthly trip summary, Geofence violations, Speed violations
- Date range, vehicle filter, format dropdown (PDF / Excel)
- Generated reports list below with download links

### 10.9 `/dashboard/settings/billing`

- Subscription cards: one per device with plan tier, next due date, status
- Bulk "Renew all" → bKash checkout
- Invoice history table

---

## 11. Multi-Tenancy

### 11.1 Implementation

- **Every database table** for tenant data has `org_id UUID NOT NULL`
- **Every repository method** that returns tenant data takes `orgId` as the first parameter
- **JWT contains `orgId`** in claims
- **`TenantContext`** is a `ThreadLocal<UUID>` set by `JwtFilter` on every request; cleared in `finally`
- **`@PreAuthorize("@orgGuard.matches(#orgId)")`** on controller methods that take an explicit org ID

### 11.2 Cross-Tenant Protection

- Devices are looked up by `imei` AND `orgId` together — never just `imei` from a user-context query
- Background jobs that operate on data without a request context use system-level access tokens with explicit `orgId` parameter
- Audit log captures every cross-org or admin-level access

### 11.3 Super Admin

- `role = SUPER_ADMIN` users can switch into any org via `X-Org-Id` header
- All super-admin actions logged to `audit_log` with `action = SUPER_ADMIN_ACCESS`
- Separate `/admin` UI section, hidden from regular users

---

## 12. Bangladesh Integrations

### 12.1 bKash Payment Gateway

**Sandbox:** `https://tokenized.sandbox.bka.sh/v1.2.0-beta`
**Production:** `https://tokenized.pay.bka.sh/v1.2.0-beta`

**Flow:**
1. User clicks "Renew" → backend calls bKash `/tokenized/checkout/create` with `amount`, `merchantInvoiceNumber`, `payerReference`
2. Backend returns `bkashURL` to frontend
3. Frontend redirects user to bKash hosted checkout
4. User completes payment on bKash; bKash redirects back to `callbackURL`
5. Backend `/billing/webhooks/bkash` validates the payment via `/tokenized/checkout/execute`
6. On success, mark subscription paid + extend `next_due_at`

**Required env:**
```
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_CALLBACK_URL=https://api.pingpath.com/api/v1/billing/webhooks/bkash
```

**Library:** No official Java SDK. Use Spring `RestClient` with manual API calls.

### 12.2 SSL Wireless SMS

**Endpoint:** `https://smsplus.sslwireless.com/api/v3/send-sms`
**Method:** POST JSON

```json
{
  "api_token": "...",
  "sid": "PINGPATH",
  "msisdn": "8801XXXXXXXXX",
  "sms": "Your alarm: SOS triggered at 23.81, 90.41",
  "csms_id": "uuid-per-message"
}
```

**Required env:**
```
SSL_SMS_API_TOKEN=
SSL_SMS_SENDER_ID=PINGPATH
```

**Templates** for all transactional SMS in `bn-BD` and `en-US`, stored in `/sms-templates/` on disk or DB.

### 12.3 Bengali Language

- All UI strings in `lib/i18n.ts` with keys in English, values in both `en` and `bn`
- Language preference stored in `users.locale`, falls back to `organizations.locale`
- Numbers: format with `Intl.NumberFormat('bn-BD')` for Bengali numerals
- Dates: format with `Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka' })`
- All SMS templates have Bengali variants
- Currency: BDT shown as `৳` symbol; format `৳ ৩৪০` for Bengali, `BDT 340` for English

### 12.4 Time Zone

- **Storage:** UTC always. `TIMESTAMPTZ` columns. Java code uses `Instant`, never `LocalDateTime`.
- **Display:** Convert at the React layer to `Asia/Dhaka` using user's locale
- **Reports:** Generated in `Asia/Dhaka` for human readability

---

## 13. Background Jobs

Implemented as `@Scheduled` Spring methods or Quartz, depending on persistence needs.

```java
@Scheduled(fixedRate = 60_000)   // every minute
public void markStaleDevicesOffline() { ... }
// Mark device OFFLINE if no heartbeat or location in last 10 minutes

@Scheduled(cron = "0 5 0 * * *", zone = "Asia/Dhaka")  // 00:05 daily
public void generateDailyReports() { ... }

@Scheduled(cron = "0 0 9 * * *", zone = "Asia/Dhaka")  // 09:00 daily
public void sendSubscriptionRenewalReminders() { ... }
// Reminder 7 days before due, 3 days before, on due date

@Scheduled(cron = "0 0 2 * * SUN", zone = "Asia/Dhaka")  // Sun 02:00
public void archiveOldLocations() { ... }
// Move locations > 90 days old to archive table or S3

@Scheduled(fixedRate = 30_000)  // every 30s
public void checkPendingDeviceCommands() { ... }
// Time out commands that haven't received a 0x15 reply
```

---

## 14. Authentication & Security

### 14.1 JWT Structure

```json
{
  "sub": "user-uuid",
  "org": "org-uuid",
  "role": "ORG_ADMIN",
  "iat": 1700000000,
  "exp": 1700003600
}
```

- Access token: 1 hour expiry
- Refresh token: 30 days, stored hashed in DB, rotates on each use
- Algorithm: HS256 with strong secret (32+ random bytes, env var)

### 14.2 Password Hashing

- BCrypt with strength 12
- Forbid passwords < 8 chars, no complexity requirements (length is the meaningful factor)
- Track `password_changed_at` for forced rotation policies

### 14.3 Rate Limiting

- Login: 5 attempts per 15 minutes per IP
- API: 100 req/sec per user
- Provisioning SMS: 10 per hour per org (cost protection)

### 14.4 CORS

- Production: only `https://app.pingpath.com`
- Dev: `http://localhost:3000`

### 14.5 Secrets Management

Environment variables only. Never commit. Use AWS Parameter Store or Secrets Manager in production.

---

## 15. Build & Deployment

### 15.1 Local Development (`docker-compose.yml`)

Services:
- `postgres` (postgres:16-alpine + postgis 3.4)
- `redis` (redis:7-alpine)
- `backend` (built from `./backend`)
- `frontend` (built from `./frontend`)

```bash
cp .env.example .env
docker compose up --build
# Backend: http://localhost:8080
# Frontend: http://localhost:3000
# Netty TCP: localhost:5023 (point your device simulator here)
```

### 15.2 Production — AWS Mumbai

**Recommended layout:**

| Service | AWS resource | Sizing (start) |
|---|---|---|
| Backend | ECS Fargate (2 tasks for HA) or single t3.medium EC2 | 2 vCPU, 4 GB |
| TCP Server | Same backend instance, port 5023 in NLB | — |
| PostgreSQL | RDS db.t3.medium, multi-AZ | 100 GB gp3 |
| Redis | ElastiCache cache.t3.micro | — |
| Frontend | CloudFront + S3 | — |
| Domain | Route 53 | — |
| TLS | ACM certificate | — |
| Logs | CloudWatch + retention 30 days | — |

**Estimated cost (Mumbai region, 100–500 vehicles):** $80–120/month.

### 15.3 CI/CD

GitHub Actions:
- On PR: run tests, build, lint
- On merge to `main`: build Docker images, push to ECR, deploy via ECS task update

---

## 16. Development Phases — 12-Week Plan

### Phase 1 — Foundation (Weeks 1–2)

**Goal:** A real GT06 device can connect, log in, and have its location stored and visible via REST API.

- [ ] Bootstrap Spring Boot project with all dependencies
- [ ] Flyway migrations V1–V2 (schema + seed data)
- [ ] Netty TCP server + frame decoder (0x78 0x78 and 0x79 0x79 variants)
- [ ] CRC-ITU implementation with unit tests
- [ ] LoginHandler with IMEI extraction
- [ ] LocationHandler for V1.8 + V3 + V4 + 4G variants
- [ ] HeartbeatHandler with status decode
- [ ] LocationService.saveAndBroadcast (DB + Redis)
- [ ] DeviceService basic CRUD
- [ ] REST: `/devices`, `/devices/{imei}/locations/last`, `/devices/{imei}/locations`
- [ ] JWT auth + multi-tenant TenantContext
- [ ] Python device simulator script in `/scripts/simulate_device.py`
- [ ] Integration test: simulator → Netty → DB → REST returns location

**Exit criteria:** A real Concox GT06N tracker connects to the dev server and its position is queryable via REST. Multi-tenant isolation tested.

### Phase 2 — Live Dashboard (Weeks 3–4)

**Goal:** A user can log in, see live vehicles on a Mapbox map, and they update in real time.

- [ ] Next.js 15 project with Tailwind + Mapbox
- [ ] Login page + auth flow + JWT storage in HTTP-only cookie
- [ ] Dashboard layout (sidebar + map)
- [ ] FleetMap component with initial REST fetch + WebSocket subscription
- [ ] STOMP WebSocket gateway on backend with org-scoped topics
- [ ] LocationFanout: Redis sub → STOMP topic
- [ ] Custom vehicle marker SVG + smooth animation
- [ ] Device list sidebar with online/offline indicators
- [ ] Click marker → device detail panel
- [ ] Bengali / English language toggle (i18n basic strings)

**Exit criteria:** Open dashboard, see all org devices on map, watch positions update live. Bengali toggle works.

### Phase 3 — Operations (Weeks 5–6)

**Goal:** Geofencing, trips, alarms, basic reports.

- [ ] Geofence schema, repository, service
- [ ] GeofenceService.evaluate() called from LocationService
- [ ] Geofence editor UI (draw circle and polygon on map)
- [ ] Trip detection logic (ACC on/off + idle-based fallback)
- [ ] Trip list page + replay UI (animated polyline)
- [ ] Alarm pipeline: 0x16 packet → Alarm record → SMS + WS broadcast
- [ ] AlarmList page, acknowledge action, alarm banner
- [ ] Daily / monthly reports (Apache POI for Excel, OpenPDF for PDF)
- [ ] Background job: stale device → OFFLINE
- [ ] DeviceCommandService: cut fuel / restore / query address from UI

**Exit criteria:** Drawing a geofence around a building and driving in/out triggers an alarm and sends an SMS. Trip with start/end appears on report.

### Phase 4 — Bangladesh Polish (Weeks 7–8)

**Goal:** Production-ready for Bangladesh customers.

- [ ] SSL Wireless SMS integration with Bengali templates
- [ ] bKash subscription billing + webhooks
- [ ] DeviceProvisioningService: SMS-based GT06 config from admin UI
- [ ] Org/User management UI (invite, roles, suspend)
- [ ] All UI strings translated to Bengali (Hind Siliguri font)
- [ ] Numbers/dates formatted for `bn-BD`
- [ ] BDT pricing display with `৳` symbol
- [ ] Audit log + super-admin org-switch UI
- [ ] Bengali installation guide PDF in `/docs`

**Exit criteria:** A new customer can sign up, pay via bKash, provision their first device entirely in Bengali, and start tracking.

### Phase 5 — Mobile App (Weeks 9–10)

**Goal:** End-user (vehicle owner) mobile app.

- [x] React Native (Expo) project setup
- [x] Login + JWT
- [x] Live map screen with own vehicles
- [x] Trip history screen
- [x] Push notifications for alarms — via **Expo Push Service** (relays through FCM on Android / APNs on iOS). Chosen over direct FCM so the backend needs no Firebase credentials and the app stays Expo Go-compatible (no native build). Backend `PushService` POSTs to `exp.host`; tokens live in `push_tokens` (V7), registered via `POST/DELETE /users/me/push-tokens`; WARNING/CRITICAL alarms only.
- [x] Geofence creation (basic) — circle-only on mobile: tap-to-place center on the WebView map, radius presets, notify-on choice, fleet assignment (preselects all vehicles). List screen with delete. Polygon drawing stays web-dashboard-only.
- [ ] iOS + Android builds via EAS Build

**Exit criteria:** APK installable, owner sees own bike live on map, gets push when SOS button pressed.

### Phase 6 — Production Hardening (Weeks 11–12)

**Goal:** Deploy to AWS Mumbai with monitoring, backups, runbook.

- [ ] Terraform infra (EC2, RDS, ElastiCache, NLB for TCP, CloudFront)
- [ ] CI/CD pipeline GitHub Actions → ECR → ECS
- [ ] Prometheus + Grafana dashboards (TCP connections, packet rate, DB queries)
- [ ] CloudWatch alerts (high error rate, low free disk, etc.)
- [ ] RDS automated backups + tested restore
- [ ] Load test: 1000 simulated devices for 24 hours
- [ ] Runbook in `/docs/RUNBOOK.md`: common incidents and fixes
- [ ] DNS, SSL cert, soft-launch with first paying customer

**Exit criteria:** First paying customer is live, monitoring shows healthy metrics, on-call runbook is in place.

---

## 17. Testing Strategy

### 17.1 Unit Tests (mandatory for these areas)

- **Protocol parser:** for every variant (V1.8, V3, V4, 4G), at minimum: login, location, heartbeat, alarm, command reply. Use real packet captures from the Concox doc as fixtures.
- **CRC-ITU:** assert known-good CRCs from doc examples
- **Coordinate decoding:** assert lat/lng for each variant against doc-provided examples
- **GeofenceService.evaluate:** test ENTER/EXIT transitions, no double-fire
- **Trip detection:** test start/end conditions

### 17.2 Integration Tests

- Embedded Postgres + Testcontainers
- Full pipeline test: simulator sends packet → Netty → DB → REST returns
- WebSocket subscription test: connect, subscribe, expect message after publish

### 17.3 Load Test

- Python `simulate_device.py` to spawn N concurrent device sessions sending at realistic rates
- Target: 1000 simultaneous devices on a single t3.medium with p99 latency < 100ms

### 17.4 Manual Test Checklist (pre-release)

- Real GT06 device end-to-end on production
- Real bKash sandbox payment
- Real SSL Wireless SMS to actual phone number
- Bengali UI on Android Chrome (font rendering)
- WebSocket reconnect after network drop

---

## 18. Common Pitfalls — Read Before Coding

1. **CRC-ITU is not standard CRC-16.** Use the polynomial 0x1021, init 0xFFFF, no reflection, XOR-out 0xFFFF. Verify against the doc examples in section 6.6.

2. **Coordinate encoding differs by variant.** V1.8 uses degrees-minutes × 30000. V3/V4/4G use raw / 1800000. Mixing them up puts your vehicle in the wrong country.

3. **Login response timing.** Devices disconnect after 5 seconds without an ACK. Send the ACK from the Netty channel before any DB lookup. Move all heavy work to a separate executor.

4. **Don't disconnect unregistered IMEIs.** Reply normally to login and heartbeat; flag as unauthorized in app layer. Disconnecting causes reconnect loops that burn the customer's data plan.

5. **GT06 0x79 0x79 frames use 2-byte length.** Both variants must be decoded in the frame splitter or you'll silently drop ICCID/voltage packets.

6. **All times are UTC over the wire and in DB.** Convert to `Asia/Dhaka` only at the display layer.

7. **GT06 password defaults to `123456`.** It's part of every server command (`DYD,123456#`). Customer-changeable but most devices ship with the default.

8. **APN matters more than people think.** Wrong APN = no data = no connection. Bangladesh APNs: `gpinternet` (GP), `internet` (Robi), `blweb` (Banglalink), `gprsunl` (Teletalk).

9. **Multi-tenant filter at the WebSocket gateway.** Never broadcast to all clients and filter in the browser — that's a privacy leak and an instant CVE.

10. **Hot path = no JPA.** `LocationService.saveAndBroadcast` runs on every packet (potentially thousands per second). Use `JdbcTemplate` with prepared statements. JPA's first-level cache and dirty checking will kill you.

11. **Always seed the dashboard from REST first.** WebSocket only delivers new events; an empty map until the first packet arrives is a bad UX.

12. **CRC over what exactly?** From byte 2 (length) through end of serial. Not over start bits. Not over stop bits. Not over the CRC field itself.

13. **`SERVER` SMS format is mode-strict.** `SERVER,1,domain,port,0#` requires a domain. `SERVER,0,IP,port,0#` requires an IP. Mixing the mode flag fails silently.

14. **bKash sandbox tokens expire after 1 hour.** Refresh per request or cache with TTL. Don't share tokens across instances.

15. **Mapbox markers don't auto-rotate with course.** Pass `rotation: course` when creating the marker, and update it on each position change. Forgetting this gives you "vehicles" facing one fixed direction.

---

## 19. Code Style

### 19.1 Java

- Spring Boot conventions
- Lombok `@Value`, `@Data`, `@Builder`, `@RequiredArgsConstructor` — not `@AllArgsConstructor` (forces ordering bugs)
- Records for DTOs (Java 21)
- `var` for local types when obvious; explicit types for public method signatures
- Always write tests for hot paths (protocol decoder, location pipeline)
- Logging: SLF4J, structured with key=value fields

### 19.2 TypeScript

- `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- No `any` — use `unknown` and narrow
- Type imports: `import type { ... }` for type-only imports
- API responses typed in `/types/api.ts` matching backend DTOs exactly

### 19.3 React

- Functional components only, hooks for state
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- Tailwind utility-first; one-off CSS modules only when justified
- No prop drilling > 2 levels — extract a context

### 19.4 SQL

- Lowercase keywords (personal preference — adjust if team disagrees, then update doc)
- Snake_case identifiers
- Migrations are immutable once merged — never edit V1 once V2 exists; add V3

### 19.5 Commit Style

- Conventional commits: `feat: add geofence editor`, `fix: correct V1.8 lat decoding`
- One concern per PR
- PR description references CLAUDE.md sections affected

---

## 20. Working with Claude Code in this Repo

### 20.1 Before any task

1. Read this CLAUDE.md (full file, not just the relevant section)
2. Read the section most relevant to the task
3. Check `/docs/GT06_PROTOCOL.md` if working on the protocol layer
4. Check existing tests for conventions

### 20.2 When in doubt

- **Decision not in this doc?** Pause and ask. If the answer is generally useful, update this doc in the same PR.
- **Conflict between this doc and the code?** This doc wins; fix the code OR update this doc explicitly with rationale.

### 20.3 What NOT to do

- Don't introduce new dependencies without checking section 2
- Don't change a Phase 1 component while working on a Phase 4 task
- Don't add features outside the current phase scope; note them as Phase N+1 work
- Don't write JPA entities for time-series tables
- Don't leave `console.log` or `System.out.println` in commits

### 20.4 What TO do

- Write tests alongside code, not after
- When adding a REST endpoint, add the type to `/types/api.ts` AND update `/docs/API.md`
- When adding a DB column, write the migration AND the rollback note in the migration file header
- When fixing a protocol bug, add a unit test with the actual byte stream that broke

---

## 21. References

- Concox GT06 Communication Protocol (V3.0, 2025-07-15) — `/docs/GT06_PROTOCOL.md`
- Traccar source code (Apache License 2.0) for GT06 protocol details — https://github.com/traccar/traccar
- Spring Boot 3.3 reference — https://docs.spring.io/spring-boot/docs/3.3.x/reference/html/
- Netty user guide — https://netty.io/wiki/user-guide-for-4.x.html
- Mapbox GL JS docs — https://docs.mapbox.com/mapbox-gl-js/api/
- bKash Tokenized Checkout — https://developer.bka.sh/docs
- SSL Wireless SMS API — https://smsplus.sslwireless.com/api-doc
- PostGIS reference — https://postgis.net/docs/

---

## 22. Glossary

- **GT06** — Concox's binary GPS tracker protocol; de facto standard for budget Chinese trackers
- **IMEI** — International Mobile Equipment Identity, 15-digit unique device ID
- **ACC** — Accessory line, vehicle ignition status (on/off)
- **APN** — Access Point Name, cellular data configuration
- **LBS** — Location Based Service, cell tower triangulation fallback when GPS is unavailable
- **MCC/MNC/LAC/CellID** — Mobile country / network / area / tower identifiers
- **Geofence** — Geographic boundary that triggers alerts when crossed
- **Heartbeat** — Periodic packet device sends to confirm the TCP connection is alive
- **Hot path** — Code path that runs on every device packet; performance-critical
- **White-label** — Reselling a third-party platform (e.g. GPSWox) under one's own brand; the opposite of MotoLink's owned-stack model

---

## 23. Competitive Positioning

Full teardown lives in [`docs/COMPETITIVE_ANALYSIS.md`](docs/COMPETITIVE_ANALYSIS.md). Summary:

- **Primary competitor: AutoNemo (Autonemo Limited)** — claims 150+ corporate clients, BTRC/VTS/BASSIS certified, iOS + Android apps.
- **They are a GPSWox white-label** (Android pkg `com.autonemovtsgpswox.track`). They rent a generic platform and can't deeply customize it — hence weak reviews on their reskinned UI and no native bKash billing.
- **MotoLink's moat is owning the full stack** (Netty GT06 server → PostGIS → custom dashboard → custom apps). We build what they can't customize: Bengali-first UX, native bKash/Nagad, bespoke corporate self-service.
- **Parity checklist** (match before/around launch): real-time track + route replay, fuel monitoring, geofence alerts, driver behavior, e-lock/immobilization (GT06 `DYD`/`HFYD`), fleet/vertical solutions (bike, school bus, asset). Fuel-sensor hardware and dashcam/video telematics are post-Phase-4 roadmap items.
- **Pricing benchmark:** AutoNemo hardware ৳4,000–9,000 one-time; ~৳500/vehicle/month subscription. MotoLink's ৳200–500/month band is competitive.
- **Non-code blocker for corporate:** BTRC/VTS-type certification is a trust prerequisite for corporate/government fleets — track as a business task.

---

*Last updated: 2026-07-08. Update the date when you change anything substantive.*
