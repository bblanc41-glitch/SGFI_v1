package com.sgifbackend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /*
     Injection du  bean CorsConfigurationSource defini dans CorsConfig.java.
     Pour garantir que Spring Security utilise notre bean et l'applique avant le filtre d'authentification.
     */
    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    
    @Lazy
    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
		            /*Injection explicite du bean CORS depuis CorsConfig Le filtre CORS s'exécute en premier, avant toute authentification.
		           	C'est pourquoi le preflight OPTIONS reçoit les bons headers au lieu du 401 "Basic realm=Realm".*/
		        	//.cors(Customizer.withDefaults())
		            .cors(cors -> cors.configurationSource(corsConfigurationSource))
		
		            .csrf(AbstractHttpConfigurer::disable)
		
		            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
		
		            .authorizeHttpRequests(auth -> auth
		                // OPTIONS gere par le filtre CORS ci-dessus, mais on le permet
		                // aussi ici pour les cas ou le filtre ne serait pas déclenché
		                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
		                .requestMatchers("/api/auth/**").permitAll()
		                .anyRequest().authenticated()
		            )
		
		            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
		            .build();
    }
}