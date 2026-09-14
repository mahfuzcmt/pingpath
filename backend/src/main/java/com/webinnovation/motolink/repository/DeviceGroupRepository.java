package com.webinnovation.motolink.repository;

import com.webinnovation.motolink.domain.DeviceGroup;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class DeviceGroupRepository {

    private final NamedParameterJdbcTemplate jdbc;

    private static final String SELECT_FIELDS = """
            SELECT id, org_id, name, description, color, icon, sort_order, is_default,
                   created_at, updated_at
            """;

    private static final RowMapper<DeviceGroup> ROW_MAPPER = (rs, rn) -> new DeviceGroup(
            rs.getObject("id", UUID.class),
            rs.getObject("org_id", UUID.class),
            rs.getString("name"),
            rs.getString("description"),
            rs.getString("color"),
            rs.getString("icon"),
            rs.getInt("sort_order"),
            rs.getBoolean("is_default"),
            rs.getObject("created_at", OffsetDateTime.class).toInstant(),
            rs.getObject("updated_at", OffsetDateTime.class).toInstant()
    );

    public Optional<DeviceGroup> findById(UUID orgId, UUID id) {
        try {
            DeviceGroup g = jdbc.queryForObject(
                    SELECT_FIELDS + " FROM device_groups WHERE org_id = :orgId AND id = :id",
                    new MapSqlParameterSource("orgId", orgId).addValue("id", id),
                    ROW_MAPPER);
            return Optional.ofNullable(g);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<DeviceGroup> findByName(UUID orgId, String name) {
        try {
            DeviceGroup g = jdbc.queryForObject(
                    SELECT_FIELDS + " FROM device_groups WHERE org_id = :orgId AND name = :name",
                    new MapSqlParameterSource("orgId", orgId).addValue("name", name),
                    ROW_MAPPER);
            return Optional.ofNullable(g);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<DeviceGroup> findDefault(UUID orgId) {
        try {
            DeviceGroup g = jdbc.queryForObject(
                    SELECT_FIELDS + " FROM device_groups WHERE org_id = :orgId AND is_default = true",
                    new MapSqlParameterSource("orgId", orgId),
                    ROW_MAPPER);
            return Optional.ofNullable(g);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<DeviceGroup> listForOrg(UUID orgId) {
        return jdbc.query(
                SELECT_FIELDS + " FROM device_groups WHERE org_id = :orgId ORDER BY sort_order, name",
                new MapSqlParameterSource("orgId", orgId),
                ROW_MAPPER);
    }

    public DeviceGroup create(DeviceGroup group) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO device_groups (id, org_id, name, description, color, icon, sort_order, is_default, created_at, updated_at)
                VALUES (:id, :orgId, :name, :description, :color, :icon, :sortOrder, :isDefault, now(), now())
                """, new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("orgId", group.orgId())
                .addValue("name", group.name())
                .addValue("description", group.description())
                .addValue("color", group.color())
                .addValue("icon", group.icon())
                .addValue("sortOrder", group.sortOrder())
                .addValue("isDefault", group.isDefault()));
        return findById(group.orgId(), id).orElseThrow();
    }

    public int update(UUID orgId, UUID id, String name, String description, String color, String icon, Integer sortOrder) {
        return jdbc.update("""
                UPDATE device_groups SET
                  name = COALESCE(:name, name),
                  description = COALESCE(:description, description),
                  color = COALESCE(:color, color),
                  icon = COALESCE(:icon, icon),
                  sort_order = COALESCE(:sortOrder, sort_order),
                  updated_at = now()
                WHERE org_id = :orgId AND id = :id AND is_default = false
                """, new MapSqlParameterSource()
                .addValue("orgId", orgId)
                .addValue("id", id)
                .addValue("name", name)
                .addValue("description", description)
                .addValue("color", color)
                .addValue("icon", icon)
                .addValue("sortOrder", sortOrder));
    }

    public int delete(UUID orgId, UUID id) {
        // First, move all devices in this group to ungrouped (null)
        jdbc.update("""
                UPDATE devices SET group_id = NULL, updated_at = now()
                WHERE org_id = :orgId AND group_id = :groupId
                """, new MapSqlParameterSource("orgId", orgId).addValue("groupId", id));

        // Then delete the group (but not default groups)
        return jdbc.update("""
                DELETE FROM device_groups
                WHERE org_id = :orgId AND id = :id AND is_default = false
                """, new MapSqlParameterSource("orgId", orgId).addValue("id", id));
    }

    /**
     * Count devices in each group for the org.
     * Returns a map of group_id -> count. Null key represents ungrouped devices.
     */
    public java.util.Map<UUID, Integer> countDevicesByGroup(UUID orgId) {
        return jdbc.query("""
                SELECT group_id, COUNT(*)::int AS count
                FROM devices
                WHERE org_id = :orgId
                GROUP BY group_id
                """, new MapSqlParameterSource("orgId", orgId),
                rs -> {
                    java.util.Map<UUID, Integer> result = new java.util.HashMap<>();
                    while (rs.next()) {
                        UUID groupId = rs.getObject("group_id", UUID.class);
                        result.put(groupId, rs.getInt("count"));
                    }
                    return result;
                });
    }

    /**
     * Reorder groups by setting sort_order based on the provided list order.
     */
    public void reorder(UUID orgId, List<UUID> groupIds) {
        for (int i = 0; i < groupIds.size(); i++) {
            jdbc.update("""
                    UPDATE device_groups SET sort_order = :order, updated_at = now()
                    WHERE org_id = :orgId AND id = :id
                    """, new MapSqlParameterSource()
                    .addValue("orgId", orgId)
                    .addValue("id", groupIds.get(i))
                    .addValue("order", i));
        }
    }
}
