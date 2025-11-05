package com.gaedet.biocampovet.security;

import com.gaedet.biocampovet.core.users.enums.RoleName;
import com.gaedet.biocampovet.core.users.service.CustomUserDetailsService;
import org.apache.catalina.filters.CorsFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, CustomUserDetailsService userDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf().disable()
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .antMatchers("/api/auth/login").permitAll()
                        .antMatchers("/api/public/**").permitAll()
                        .antMatchers("/api/document-types/**").permitAll()
                        .antMatchers("/api/admin/**").hasAuthority(RoleName.ROLE_ADMIN.name())
                        .antMatchers("/api/veterinarian/**").hasAuthority(RoleName.ROLE_VETERINARIAN.name())
                        .antMatchers("/api/assistant/**").hasAuthority(RoleName.ROLE_ASSISTANT.name())
                        .antMatchers("/api/receptionist/**").hasAuthority(RoleName.ROLE_RECEPTIONIST.name())
                        .antMatchers("/api/manager/**").hasAuthority(RoleName.ROLE_MANAGER.name())
                        .antMatchers("/api/groomer/**").hasAuthority(RoleName.ROLE_GROOMER.name())
                        .antMatchers("/api/supervisor/**").hasAuthority(RoleName.ROLE_SUPERVISOR.name())
                        .antMatchers("/api/warehouse/**").hasAuthority(RoleName.ROLE_WAREHOUSE.name())
                        .antMatchers("/api/cashier/**").hasAuthority(RoleName.ROLE_CASHIER.name())
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://192.168.75.17:3000",
                "http://192.168.1.8:3000",
                "https://biocampovet.gaedet.com"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(authProvider);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
