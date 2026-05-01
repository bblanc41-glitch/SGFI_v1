package com.sgifbackend.config;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sgifbackend.models.Dossier;
import com.sgifbackend.models.HistoriqueDossier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import java.util.List;

/*
  Configuration Jackson pour
   1. Eviter  la recursion infinie Dossier → historique → HistoriqueDossier → dossier → ...
      en masquant les deux cotes via des Mix-ins (sans toucher aux entites JPA).
   2. Dsactiver l'ecriture des dates Java 8 en timestamps (utilise ISO-8601).
 */
@Configuration
public class JacksonConfig {

    //pour masque la liste d'historique dans Dossier
    abstract static class DossierMixIn {
        @JsonIgnore
        abstract List<HistoriqueDossier> getHistorique();
    }

    //masque la reference retour vers Dossier dans HistoriqueDossier
    abstract static class HistoriqueMixIn {
        @JsonIgnore
        abstract Dossier getDossier();
    }

    @Bean
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        ObjectMapper mapper = builder.build();

        // Support de LocalDate / LocalDateTime
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Application des Mix-ins anti-recursion
        mapper.addMixIn(Dossier.class,           DossierMixIn.class);
        mapper.addMixIn(HistoriqueDossier.class, HistoriqueMixIn.class);

        return mapper;
    }
}