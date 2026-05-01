import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterLink }        from '@angular/router';
import { DossierService }    from '../../services/dossier.service';
import { Stats, getLibelle, getBadgeClass } from '../../models/dossier';

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.css',
})
export class Dashboard implements OnInit {

  stats: Stats = { total: 0, enAttente: 0, envoyeAvocat: 0, enInstance: 0, cloture: 0, incomplet: 0 };
  chargement = true;

  // Raccourcis utilisés dans le template
  getLibelle    = getLibelle;
  getBadgeClass = getBadgeClass;

  constructor(private dossierService: DossierService) {}

  ngOnInit(): void {
    this.dossierService.getStats().subscribe({
      next:  stats => { this.stats = stats; this.chargement = false; },
      error: ()    => { this.chargement = false; }
    });
  }

  /** Cartes de statistiques affichées dans le dashboard */
  get cartes() {
    return [
      { label: 'Total dossiers',      valeur: this.stats.total,        icone: 'bi-folder2-open',    couleur: 'primary' },
      { label: 'En attente',          valeur: this.stats.enAttente,    icone: 'bi-hourglass-split', couleur: 'warning' },
      { label: 'Envoyés à l\'avocat', valeur: this.stats.envoyeAvocat, icone: 'bi-send',            couleur: 'info'    },
      { label: 'En instance',         valeur: this.stats.enInstance,   icone: 'bi-bank',            couleur: 'secondary'},
      { label: 'Dossiers incomplets', valeur: this.stats.incomplet,    icone: 'bi-exclamation-triangle', couleur: 'danger' },
      { label: 'Clôturés',            valeur: this.stats.cloture,      icone: 'bi-check-circle',    couleur: 'success' },
    ];
  }
}