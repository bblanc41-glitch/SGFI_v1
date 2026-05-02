package com.sgifbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
/*RestTemplate est le client HTTP de Spring.Permet d'appeler des API REST externes depuis le backend Java.
 Utile si un jour le SGFI doit interroger un service externe(ex: API SMS pour alerter les avocats, webservice CNOPS/CNSS…)
*/
@Configuration
public class RestTemplateConfig {

 @Bean
 public RestTemplate restTemplate() {
     return new RestTemplate();/* Crée et enregistre une instance unique de RestTemplate dans le contexte Spring (singleton par défaut).
      N'importe quel service peut maintenant l'injecter avec : @Autowired private RestTemplate restTemplate;*/
 }
}