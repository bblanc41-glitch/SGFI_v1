package com.sgifbackend.controllers;

import com.sgifbackend.models.Notification;
import com.sgifbackend.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public List<Notification> getAll() {
        return notificationRepository.findAllByOrderByDateCreationDesc();
    }

    @GetMapping("/non-lues")
    public long countNonLues() {
        return notificationRepository.countByLuFalse();
    }

    @PutMapping("/{id}/lu")
    public ResponseEntity<Void> marquerCommeLue(@PathVariable Long id) {
        notificationRepository.marquerCommeLue(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        notificationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}