package com.sgifbackend.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

   
    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    
    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);// Désactive l'enregistrement automatique comme filtre servlet. Spring Security gère lui-même l'ajout via addFilterBefore ci-dessous.
        return registration;
    }
    
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
		            
		            .csrf(AbstractHttpConfigurer::disable)
		            
		            /*Injection explicite du bean CORS depuis CorsConfig Le filtre CORS s'exécute en premier, avant toute authentification.
		           	C'est pourquoi le preflight OPTIONS reçoit les bons headers au lieu du 401 "Basic realm=Realm".*/
		        	//.cors(Customizer.withDefaults())
		            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
		            
		            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
		            
		            .exceptionHandling(exception -> exception
		                    .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
		                )
		            
		            .authorizeHttpRequests(auth -> auth
		                
		            	.requestMatchers("/api/auth/**").permitAll()
		            	
		            	//Route avec jetons obligatoire
		            	.requestMatchers("/api/dossiers/**",
		            					"/api/importation/**",
		            					"/api/fichiers/**").authenticated()
		                
		            	// OPTIONS gere par le filtre CORS ci-dessus, mais on le permet
		                // aussi ici pour les cas ou le filtre ne serait pas déclenché
		                //.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
		                .anyRequest().authenticated()
		            )
		
		            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
		            .build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
    	CorsConfiguration configuration = new CorsConfiguration();
    	
    	configuration.setAllowedOrigins(List.of(
                "http://localhost:4200" //Seul Angular en developpement est autorise. on devra remplacer par l'url du chu
    			));
    	configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
            );
    	configuration.setAllowedHeaders(List.of("*"));// Autorise tous les en-tetes HTTP. Inclut "Authorization" de JwtInterceptor qu'Angular envoie.
    	configuration.setAllowCredentials(true);//Autorise l'envoi de cookies et d'en-tetes d'authentification dans les requêtes cross-origin.   	
    	configuration.setExposedHeaders(List.of("Authorization"));//pour lecture de l'entete par Angular
    	configuration.setMaxAge(3600L);
    	
    	UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);//Application de cette configuration CORS à TOUS les endpoints

        return source;
                
    }
}