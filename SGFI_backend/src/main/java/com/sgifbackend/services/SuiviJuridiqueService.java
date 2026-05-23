package com.sgifbackend.services;

import com.sgifbackend.models.SuiviJuridique;
import com.sgifbackend.models.TypeAudience;
import com.sgifbackend.repositories.SuiviJuridiqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class SuiviJuridiqueService {

    private final SuiviJuridiqueRepository repository;

    public SuiviJuridique getOrCreateByReference(String referenceInterne) {
        return repository.findByReferenceInterne(referenceInterne)
                .orElseGet(() -> repository.save(SuiviJuridique.builder()
                        .referenceInterne(referenceInterne)
                        .build()));
    }

    public Optional<SuiviJuridique> findByReference(String referenceInterne) {
        return repository.findByReferenceInterne(referenceInterne);
    }

    public SuiviJuridique save(SuiviJuridique suivi) {
        return repository.save(suivi);
    }

    public void deleteByReference(String referenceInterne) {
        repository.deleteByReferenceInterne(referenceInterne);
    }
}