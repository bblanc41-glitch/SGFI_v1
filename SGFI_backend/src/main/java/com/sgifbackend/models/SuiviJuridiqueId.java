package com.sgifbackend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuiviJuridiqueId implements Serializable {
	private static final long serialVersionUID = 1L;
    private String referenceInterne;
    private String referenceExterne;
    private TypeAudience typeAudience;
}