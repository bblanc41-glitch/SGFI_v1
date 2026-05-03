package com.sgifbackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
	@JsonProperty("token")
	private String token;
	/*
	 @Data => pour getters & setters
	 @AllArgsConstructor => constructeur avec paramettre
	 @NoArgsConstructor => constructeur sans paramettre*/
	
  
}
