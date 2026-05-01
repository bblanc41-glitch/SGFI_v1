package com.sgifbackend.controllers;

import com.sgifbackend.dto.AuthResponse;
import com.sgifbackend.dto.LoginRequest;
import com.sgifbackend.models.Utilisateur;
import com.sgifbackend.repositories.UtilisateurRepository;
import com.sgifbackend.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*")// Pour permetre la communication spring & angular   ou @CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

    @Autowired
    private UtilisateurRepository userRepo;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    	
    	// Recherche de l'utilisateur dans la BD
        Optional<Utilisateur> optUser = userRepo.findByUsername(request.getUsername());

        //Si utilisateur present avec bon pasword return le token de responseEntity 
        if (optUser.isPresent() && optUser.get().getPassword().equals(request.getPassword())) {
            Utilisateur u = optUser.get();
            String token = jwtUtil.generateToken(u.getUsername(), u.getRole());
            return ResponseEntity.ok(new AuthResponse(token));
        }

        return ResponseEntity
				            .status(HttpStatus.UNAUTHORIZED)
				            .body("Identifiants incorrects. Vérifiez le username et le mot de passe.");
    }
}
