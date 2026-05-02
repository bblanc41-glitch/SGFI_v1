package com.sgifbackend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sgifbackend.repositories.UtilisateurRepository;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    @Autowired
    private JwtUtil jwtUtil;
    // ↑ AJOUT : injecte JwtUtil pour décoder et valider les vrais tokens JWT
    //   Avant : le filtre comparait à "mon-super-token-secret" → incompatible
    //   avec les tokens générés par AuthController via jwtUtil.generateToken()

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String token = extraireToken(request);

            if (token != null && jwtUtil.isTokenValid(token)) {
                //isTokenValid() vérifie la signature HMAC et la date d'expiration

                String username = jwtUtil.extractUsername(token); // => Lit le "subject" du JWT → username mis lors de la connexion

                String role = jwtUtil.extractRole(token); // => Lit le claim "role" → mis dans generateToken() de AuthController

                utilisateurRepository.findByUsername(username).ifPresent(utilisateur -> {
                    // => Vérifie que l'utilisateur existe toujours en BDD

                    List<SimpleGrantedAuthority> autorisations = List.of(
                        new SimpleGrantedAuthority("ROLE_" + role)
                        // ↑ REMPLACE : "ROLE_" + u.getRole() via BDD
                        //   Le rôle est déjà dans le token → pas besoin de requête BDD
                    );

                    UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            autorisations
                        );

                    authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                });
            }
        } catch (Exception e) {
            logger.error("Impossible d'authentifier pour la requête : {}",
                request.getRequestURI(), e);
        }

        filterChain.doFilter(request, response);
    }

    private String extraireToken(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}

/*package com.sgifbackend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sgifbackend.models.Utilisateur;
import com.sgifbackend.repositories.UtilisateurRepository;

import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);//les logs montrent leur source exacte.
	
    // Token statique actuel (a remplacer plus tard par une vraie bibliotheque JWT)
    private static final String TOKEN_VALIDE = "mon-super-token-secret";
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    //Injection durepository pour pouvoir charger l'utilisateur  depuis la base de données MySQL lors de la validation du token
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
						            HttpServletResponse response,
						            FilterChain filterChain) throws ServletException, IOException{
    	try {
            String token = extraireToken(request);//extraire le token JWT de l'entete Authorization.
            
            if (token != null && token.equals(TOKEN_VALIDE)) {
            	 Optional<Utilisateur> utilisateur = utilisateurRepository.findByUsername("admin");
            	 if (utilisateur.isPresent()) {
                     Utilisateur u = utilisateur.get();

                     List<SimpleGrantedAuthority> autorisations = Collections.singletonList(
                         new SimpleGrantedAuthority("ROLE_" + u.getRole())
                     );
                     
                     UsernamePasswordAuthenticationToken authentication =
                         new UsernamePasswordAuthenticationToken(
								                                 u.getUsername(),   // Principal = identite de l'utilisateur
								                                 null,              // Credentials = null (deja authentifie par token)
								                                 autorisations      // Authorities = les reles de l'utilisateur
                             );//cree l'objet d'authentification Spring Security.Ce sera l'identite "officielle" de l'utilisateur pour cette requete.
                     
                     authentication.setDetails( new WebAuthenticationDetailsSource().buildDetails(request));//Ajout des metadonnees a l'authentification: IPClient IdSession,...
                     
                     SecurityContextHolder.getContext().setAuthentication(authentication);
            	 }
            }   
    	 } catch (Exception e) {
             logger.error("Impossible d'authentifier l'utilisateur pour la requete : {}",request.getRequestURI(), e);
    	 }

        filterChain.doFilter(request, response); 
    }
    
    // Extrait le token Bearer de l'en-tête Authorization.Format attendu : "Authorization: Bearer mon-super-token-secret"
    private String extraireToken(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");//recupperation de l'en-tete Authorization envoye par votre JwtInterceptor Angular.
        //   Exemple de valeur : "Bearer mon-super-token-secret"

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            // ↑ StringUtils.hasText = non null ET non vide ET non composé que d'espaces.
            //   startsWith("Bearer ") vérifie le format standard du token JWT.

            return headerAuth.substring(7);//Supprime le préfixe "Bearer " (7 caractères) pour obtenir uniquement le token.
            //   "Bearer mon-super-token-secret".substring(7) = "mon-super-token-secret"
        }

        return null;//L'en-tête est absent ou mal formé → pas de token → requête anonyme.
    }
    
    
}*/