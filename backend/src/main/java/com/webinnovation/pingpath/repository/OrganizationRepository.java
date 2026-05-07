package com.webinnovation.pingpath.repository;

import com.webinnovation.pingpath.domain.Organization;
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
}
