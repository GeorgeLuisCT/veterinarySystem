package com.gaedet.veterinarysystem.security;

import com.gaedet.veterinarysystem.core.users.enums.RoleName;
import com.gaedet.veterinarysystem.core.users.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
// Activa @PreAuthorize en los controladores (antes estaban declarados pero NO se aplicaban)
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private static final String ADMIN = RoleName.ROLE_ADMIN.name();
    private static final String MANAGER = RoleName.ROLE_MANAGER.name();
    private static final String CASHIER = RoleName.ROLE_CASHIER.name();
    private static final String RECEPTIONIST = RoleName.ROLE_RECEPTIONIST.name();
    private static final String VETERINARIAN = RoleName.ROLE_VETERINARIAN.name();
    private static final String ASSISTANT = RoleName.ROLE_ASSISTANT.name();
    private static final String GROOMER = RoleName.ROLE_GROOMER.name();

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService userDetailsService) {
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

                        // ---- Reglas por módulo (alineadas con la navegación del frontend) ----
                        // Finanzas: solo administración. La lista de cuentas de tesorería se lee también
                        // al cerrar caja (cajero) y en reportes (gerente).
                        .antMatchers("/api/finance/**", "/api/accounts-payable/**").hasAuthority(ADMIN)
                        .antMatchers(HttpMethod.GET, "/api/treasury-accounts", "/api/treasury-accounts/*")
                            .hasAnyAuthority(ADMIN, MANAGER, CASHIER)
                        .antMatchers("/api/treasury-accounts/**").hasAuthority(ADMIN)

                        // Caja
                        .antMatchers(HttpMethod.GET, "/api/cash-sessions/active")
                            .hasAnyAuthority(ADMIN, MANAGER, CASHIER, RECEPTIONIST)
                        .antMatchers(HttpMethod.GET, "/api/cash-sessions/history").hasAnyAuthority(ADMIN, MANAGER)
                        .antMatchers("/api/cash-sessions/**").hasAnyAuthority(ADMIN, MANAGER, CASHIER)

                        // Ventas: anular es una decisión de supervisión
                        .antMatchers(HttpMethod.POST, "/api/sales/*/void").hasAnyAuthority(ADMIN, MANAGER)
                        .antMatchers("/api/sales/**").hasAnyAuthority(ADMIN, MANAGER, CASHIER, RECEPTIONIST)

                        // Reportes (GraphQL)
                        .antMatchers("/api/reports/**").hasAnyAuthority(ADMIN, MANAGER)

                        // Veterinaria de campo
                        .antMatchers("/api/fieldwork/**", "/api/farms/**", "/api/geo-zones/**")
                            .hasAnyAuthority(ADMIN, MANAGER, VETERINARIAN)

                        // Módulo clínico (datos clínicos: solo personal clínico)
                        .antMatchers("/api/clinical-attentions/**", "/api/hospitalizations/**", "/api/cages/**",
                                "/api/surgical-reports/**", "/api/laboratory-requests/**")
                            .hasAnyAuthority(ADMIN, MANAGER, VETERINARIAN, ASSISTANT)
                        // Catálogos clínicos: lectura general, escritura de veterinaria/administración
                        .antMatchers(HttpMethod.GET, "/api/prescription-templates/**", "/api/health-plans/**",
                                "/api/laboratory-tests/**", "/api/clinical-services/**").authenticated()
                        .antMatchers("/api/prescription-templates/**", "/api/health-plans/**",
                                "/api/laboratory-tests/**", "/api/clinical-services/**")
                            .hasAnyAuthority(ADMIN, MANAGER, VETERINARIAN)

                        // Peluquería
                        .antMatchers("/api/grooming-sessions/**")
                            .hasAnyAuthority(ADMIN, MANAGER, GROOMER, RECEPTIONIST)

                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:8090",
                "https://veterinarysystem.gaedet.com"));
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
