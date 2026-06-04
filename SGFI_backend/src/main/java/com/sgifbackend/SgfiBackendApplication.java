package com.sgifbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SgfiBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(SgfiBackendApplication.class, args);
	}

}
