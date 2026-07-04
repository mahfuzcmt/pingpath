package com.webinnovation.motolink.repository;

import com.webinnovation.motolink.domain.Organization;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class OrganizationRepository {

    private final NamedParameterJdbcTemplate jdbc;

    private static final RowMapper<Organization> ROW_MAPPER = (rs, rn) -> new Organization(
            rs.getObject("id", UUID.class),
            rs.getString("name"),
            rs.getString("slug"),
            rs.getString("plan_tier"),
            rs.getString("status"),
            rs.getString("contact_email"),
            rs.getString("contact_phone"),
            rs.getString("address"),
            rs.getString("locale"),
            rs.getString("timezone"),
            rs.getObject("created_at", java.time.OffsetDateTime.class).toInstant(),
            rs.getObject("updated_at", java.time.OffsetDateTime.class).toInstant()
    );

    public Optional<Organization> findById(UUID id) {
        try {
            Organization o = jdbc.queryForObject(
                    "SELECT * FROM organizations WHERE id = :id",
                    new MapSqlParameterSource("id", id),
                    ROW_MAPPER);
            return Optional.ofNullable(o);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<Organization> findBySlug(String slug) {
        try {
            Organization o = jdbc.queryForObject(
                    "SELECT * FROM organizations WHERE slug = :slug",
                    new MapSqlParameterSource("slug", slug),
                    ROW_MAPPER);
            return Optional.ofNullable(o);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public java.util.List<Organization> findAll() {
        return jdbc.query(
                "SELECT * FROM organizations ORDER BY created_at DESC",
                ROW_MAPPER);
    }

    public int update(UUID id, String name, String contactEmail, String contactPhone,
                      String address, String locale, String timezone) {
        var params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("name", name)
                .addValue("contactEmail", contactEmail)
                .addValue("contactPhone", contactPhone)
                .addValue("address", address)
                .addValue("locale", locale)
                .addValue("timezone", timezone);
        return jdbc.update("""
                UPDATE organizations
                   SET name          = COALESCE(:name, name),
                       contact_email = COALESCE(:contactEmail, contact_email),
                       contact_phone = COALESCE(:contactPhone, contact_phone),
                       address       = COALESCE(:address, address),
                       locale        = COALESCE(:locale, locale),
                       timezone      = COALESCE(:timezone, timezone),
                       updated_at    = now()
                 WHERE id = :id
                """, params);
    }
}
