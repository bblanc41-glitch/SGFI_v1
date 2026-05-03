package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Table(name = "utilisateurs")
@Data
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAgent;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;        // Doit être haché (BCrypt) en production

    /** ROLE_ADMIN | ROLE_JURIDIQUE | ROLE_CCR */
    private String role;

	/*
    public Long getIdAgent() {
		return idAgent;
	}

	public void setIdAgent(Long idAgent) {
		this.idAgent = idAgent;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}*/
}