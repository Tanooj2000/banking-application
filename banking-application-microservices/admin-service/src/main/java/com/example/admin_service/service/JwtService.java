package com.example.admin_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret:myAdminSecretKey}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // 24 hours in milliseconds
    private Integer jwtExpiration;

    public String extractUsername(String token) {
        try {
            String username = extractClaim(token, Claims::getSubject);
            System.out.println("[JWT DEBUG] Extracted username: " + username);
            return username;
        } catch (Exception e) {
            System.out.println("[JWT DEBUG] Error extracting username: " + e.getMessage());
            throw e;
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails
    ) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    public String generateToken(String username, Long adminId) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("adminId", adminId);
        extraClaims.put("role", "ADMIN"); // Default role
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    public String generateToken(String username, Long adminId, String role) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("adminId", adminId);
        extraClaims.put("role", role);
        extraClaims.put("tokenType", "STATELESS"); // Marker for stateless tokens
        
        System.out.println("[JWT DEBUG] Generating stateless token:");
        System.out.println("  - Username: " + username);
        System.out.println("  - AdminId: " + adminId);
        System.out.println("  - Role: " + role);
        
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public long getExpirationTime() {
        return jwtExpiration;
    }

    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration
    ) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            boolean usernameMatches = username.equals(userDetails.getUsername());
            boolean tokenNotExpired = !isTokenExpired(token);
            boolean isValid = usernameMatches && tokenNotExpired;
            
            System.out.println("[JWT DEBUG] Token validation:");
            System.out.println("  - Token username: " + username);
            System.out.println("  - UserDetails username: " + userDetails.getUsername());
            System.out.println("  - Username matches: " + usernameMatches);
            System.out.println("  - Token not expired: " + tokenNotExpired);
            System.out.println("  - Overall valid: " + isValid);
            
            return isValid;
        } catch (Exception e) {
            System.out.println("[JWT DEBUG] Error validating token: " + e.getMessage());
            return false;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            // For stateless authentication - only check token validity
            final String username = extractUsername(token);
            boolean tokenNotExpired = !isTokenExpired(token);
            boolean isValid = username != null && !username.isEmpty() && tokenNotExpired;
            
            System.out.println("[JWT DEBUG] Stateless token validation:");
            System.out.println("  - Token username: " + username);
            System.out.println("  - Token not expired: " + tokenNotExpired);
            System.out.println("  - Overall valid: " + isValid);
            
            return isValid;
        } catch (Exception e) {
            System.out.println("[JWT DEBUG] Error validating token: " + e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    /**
     * Debug method to display all claims in a JWT token
     */
    public void debugTokenClaims(String token) {
        try {
            Claims claims = extractAllClaims(token);
            System.out.println("[JWT DEBUG] All token claims:");
            System.out.println("  - Subject (username): " + claims.getSubject());
            System.out.println("  - Issued At: " + claims.getIssuedAt());
            System.out.println("  - Expiration: " + claims.getExpiration());
            
            // Print all custom claims
            claims.forEach((key, value) -> {
                if (!key.equals("sub") && !key.equals("iat") && !key.equals("exp")) {
                    System.out.println("  - " + key + ": " + value);
                }
            });
        } catch (Exception e) {
            System.out.println("[JWT DEBUG] Error reading token claims: " + e.getMessage());
        }
    }

    private Key getSignInKey() {
        byte[] keyBytes = jwtSecret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Long extractAdminId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("adminId", Long.class);
    }
    
    public String extractRole(String token) {
        try {
            Claims claims = extractAllClaims(token);
            
            // Get role from single role claim
            String role = claims.get("role", String.class);
            System.out.println("[JWT DEBUG] Role from 'role' claim: " + role);
            
            // If no role claim, try to determine from username
            if (role == null || role.isEmpty()) {
                String username = claims.getSubject();
                System.out.println("[JWT DEBUG] No role claim found, checking username: " + username);
                
                // Check if this looks like a root admin
                if (username != null && (username.equals("rootadmin") || 
                    username.startsWith("root") || 
                    username.contains("rootadmin"))) {
                    role = "ROOT_ADMIN";
                    System.out.println("[JWT DEBUG] Detected ROOT_ADMIN based on username pattern");
                } else {
                    // Default to ADMIN if still no role found
                    role = "ADMIN";
                    System.out.println("[JWT DEBUG] No role indicators found, defaulting to ADMIN");
                }
            }
            
            // Clean up role string (remove ROLE_ prefix if present)
            if (role != null && role.startsWith("ROLE_")) {
                role = role.substring(5);
                System.out.println("[JWT DEBUG] Cleaned role (removed ROLE_ prefix): " + role);
            }
            
            System.out.println("[JWT DEBUG] Final extracted role: " + role);
            return role != null ? role : "ADMIN";
        } catch (Exception e) {
            System.out.println("[JWT DEBUG] Error extracting role: " + e.getMessage());
            return "ADMIN";
        }
    }
}