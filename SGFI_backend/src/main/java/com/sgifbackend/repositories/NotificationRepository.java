package com.sgifbackend.repositories;

import com.sgifbackend.models.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByOrderByDateCreationDesc();
    long countByLuFalse();
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.id = ?1")
    void marquerCommeLue(Long id);
}