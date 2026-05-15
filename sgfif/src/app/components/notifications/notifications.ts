import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DossierService } from '../../services/dossier.service';
import { Notification } from '../../models/dossier';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class Notifications implements OnInit {
  notifications: Notification[] = [];
  chargement = true;

  constructor(private dossierService: DossierService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
  this.dossierService.getNotifications().subscribe({
    next: (data) => {
      this.notifications = data;
      this.chargement = false;
      this.cdr.detectChanges();   // ← force la mise à jour du template
      console.log('Notifications reçues :', data);
    },
    error: (err) => {
      console.error(err);
      this.chargement = false;
      this.cdr.detectChanges();
    }
  });
}

  marquerLue(id: number): void {
    this.dossierService.marquerCommeLue(id).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.lu = true;
      },
      error: (err) => console.error(err)
    });
  }

  supprimer(id: number): void {
    if (confirm('Supprimer cette notification ?')) {
      this.dossierService.supprimerNotification(id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== id);
        },
        error: (err) => console.error(err)
      });
    }
  }
}