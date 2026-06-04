package com.sgifbackend.services;

import com.sgifbackend.models.Notification;
import com.sgifbackend.models.SuiviJuridique;
import com.sgifbackend.models.TypeAudience;
import com.sgifbackend.repositories.NotificationRepository;
import com.sgifbackend.repositories.SuiviJuridiqueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@EnableScheduling
@Slf4j
public class AlerteSuiviService {

    private final SuiviJuridiqueRepository suiviRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    // Types d'alertes
    private static final String ALERTE_ECHEANCE = "ALERTE_ECHEANCE";
    private static final String ALERTE_EXPIRE = "ALERTE_EXPIRE";
    private static final String ALERTE_SANS_DATE = "ALERTE_SANS_DATE";

    /**
     * Vérification quotidienne à 08:00
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void verifierAlertesSuivis() {
        log.info("Début de la vérification des alertes de suivis à {}", LocalDateTime.now());
        
        List<SuiviJuridique> tousLesSuivis = suiviRepository.findAll();
        
        for (SuiviJuridique suivi : tousLesSuivis) {
            verifierEtCreerAlerte(suivi);
        }
        
        log.info("Fin de la vérification des alertes de suivis");
    }

    /**
     * Vérifie un suivi et crée une notification si nécessaire
     */
    private void verifierEtCreerAlerte(SuiviJuridique suivi) {
        Long idDossier = extractIdDossierFromReference(suivi.getReferenceInterne());
        
        // Cas 1 : Délai dépassé (date d'audience passée sans jugement)
        if (suivi.getDateAudience() != null && suivi.getDateAudience().isBefore(LocalDate.now())) {
            if (suivi.getJugement() == null || suivi.getJugement().isBlank()) {
                // Vérifier si une notification existe déjà pour ce suivi
                if (!notificationExisteDeja(idDossier, ALERTE_EXPIRE, suivi.getTypeAudience())) {
                    String message = String.format(
                        "⚠️ Délai dépassé pour l'audience %s du dossier %s. Date d'audience : %s - Aucun jugement renseigné.",
                        suivi.getTypeAudience(),
                        suivi.getReferenceInterne(),
                        suivi.getDateAudience()
                    );
                    notificationService.creerNotification(message, ALERTE_EXPIRE, idDossier);
                    log.info("Notification créée : délai dépassé pour {}", suivi.getReferenceInterne());
                }
            }
        }
        
        // Cas 2 : Échéance proche (date d'audience dans les 7 jours)
        if (suivi.getDateAudience() != null && suivi.getJugement() == null) {
            LocalDate aujourdhui = LocalDate.now();
            long joursRestants = ChronoUnit.DAYS.between(aujourdhui, suivi.getDateAudience());
            
            if (joursRestants >= 0 && joursRestants <= 7) {
                if (!notificationExisteDeja(idDossier, ALERTE_ECHEANCE, suivi.getTypeAudience())) {
                    String message = String.format(
                        "🔔 Échéance proche pour l'audience %s du dossier %s. Date d'audience dans %d jour(s) (%s).",
                        suivi.getTypeAudience(),
                        suivi.getReferenceInterne(),
                        joursRestants,
                        suivi.getDateAudience()
                    );
                    notificationService.creerNotification(message, ALERTE_ECHEANCE, idDossier);
                    log.info("Notification créée : échéance proche pour {}", suivi.getReferenceInterne());
                }
            }
        }
        
        // Cas 3 : Pas de date d'audience depuis plus de 30 jours
        if (suivi.getDateAudience() == null && suivi.getDateCreation() != null) {
            LocalDateTime dateCreation = suivi.getDateCreation();
            LocalDateTime aujourdhui = LocalDateTime.now();
            long joursSansDate = ChronoUnit.DAYS.between(dateCreation, aujourdhui);
            
            if (joursSansDate > 30 && (suivi.getJugement() == null || suivi.getJugement().isBlank())) {
                if (!notificationExisteDeja(idDossier, ALERTE_SANS_DATE, suivi.getTypeAudience())) {
                    String message = String.format(
                        "⚠️ Le suivi %s du dossier %s n'a pas de date d'audience depuis %d jours. Veuillez programmer l'audience.",
                        suivi.getTypeAudience(),
                        suivi.getReferenceInterne(),
                        joursSansDate
                    );
                    notificationService.creerNotification(message, ALERTE_SANS_DATE, idDossier);
                    log.info("Notification créée : pas de date d'audience pour {}", suivi.getReferenceInterne());
                }
            }
        }
    }
    
    /**
     * Vérifie si une notification existe déjà pour ce dossier et ce type d'alerte
     */
    private boolean notificationExisteDeja(Long idDossier, String type, TypeAudience typeAudience) {
        List<Notification> notifications = notificationRepository.findAll();
        
        return notifications.stream().anyMatch(n -> 
            n.getIdDossier() != null && 
            n.getIdDossier().equals(idDossier) && 
            n.getType().equals(type) &&
            n.getMessage().contains(typeAudience.toString()) &&
            !n.getLu()
        );
    }
    
    /**
     * Extrait l'ID du dossier depuis la référence interne
     * À adapter selon ton format de référence (ex: REF-JUR-2026-0028 → 28)
     */
    private Long extractIdDossierFromReference(String referenceInterne) {
        try {
            String[] parts = referenceInterne.split("-");
            return Long.parseLong(parts[parts.length - 1]);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Méthode manuelle pour déclencher la vérification (accessible via API)
     */
    @Transactional
    public void verifierAlertesManuellement() {
        verifierAlertesSuivis();
    }
}