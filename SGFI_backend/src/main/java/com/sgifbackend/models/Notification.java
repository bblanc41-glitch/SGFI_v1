package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor   // ← indispensable pour Hibernate
@AllArgsConstructor  // ← nécessaire pour le builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String message;

    private String type;        // "DOUBLON_IMPORT", "STATUT_CHANGE", etc.

    private Long idDossier;     // peut être null

    private Boolean lu = false;

    @CreationTimestamp
    private LocalDateTime dateCreation;
}