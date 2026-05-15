package com.sgifbackend.services;

import org.springframework.stereotype.Service;

import com.sgifbackend.models.Notification;
import com.sgifbackend.repositories.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public void creerNotification(String message, String type, Long idDossier) {
        Notification notif = Notification.builder()
                .message(message)
                .type(type)
                .idDossier(idDossier)
                .lu(false)
                .build();
        notificationRepository.save(notif);
    }
}