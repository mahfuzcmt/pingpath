package com.webinnovation.pingpath.repository;

import com.webinnovation.pingpath.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final NamedParameterJdbcTemplate jdbc;

    private static final RowMapper<User> ROW_MAPPER = (rs, rn) -> new User(
            rs.getObject("id", UUID.class),
            rs.getObject("org_id", UUID.class),
            rs.getString("email"),
            rs.getString("phone"),
            rs.getString("password_hash"),
            rs.getString("full_name"),
            rs.getString("role"),
            rs.getBoolean("is_active"),
            toInstant(rs.getObject("last_login_at", OffsetDateTime.class)),
            rs.getObject("created_at", OffsetDateTime.class).toInstant(),
            rs.getObject("updated_at", OffsetDateTime.class).toInstant()
    );

    private static Instant toInstant(OffsetDateTime odt) {
        return odt == null ? null : odt.toInstant();
    }

    public Optional<User> findByEmail(String email) {
        try {
            User u = jdbc.queryForObject(
                    "SELECT * FROM users WHERE email = :email",
                    new MapSqlParameterSource("email", email),
                    ROW_MAPPER);
            return Optional.ofNullable(u);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findById(UUID id) {
        try {
            User u = jdbc.queryForObject(
                    "SELECT * FROM users WHERE id = :id",
                    new MapSqlParameterSource("id", id),
                    ROW_MAPPER);
            return Optional.ofNullable(u);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public long count() {
        Long c = jdbc.getJdbcTemplate().queryForObject("SELECT COUNT(*) FROM users", Long.class);
        return c == null ? 0 : c;
    }

    public UUID create(UUID orgId, String email, String passwordHash, String fullName, String role) {
        UUID id = UUID.randomUUID();
        var params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("orgId", orgId)
                .addValue("email", email)
                .addValue("passwordHash", passwordHash)
                .addValue("fullName", fullName)
                .addValue("role", role);
        jdbc.update("""
                INSERT INTO users (id, org_id, email, password_hash, full_name, role)
                VALUES (:id, :orgId, :email, :passwordHash, :fullName, :role)
                """, params);
        return id;
    }

    public void touchLastLogin(UUID userId) {
        jdbc.update(
                "UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = :id",
                new MapSqlParameterSource("id", userId));
    }
}
