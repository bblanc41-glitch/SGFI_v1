import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Guard de route : vérifie la présence du token JWT en localStorage.
 * Si absent → redirection vers /login.
 *
 * Usage dans app.routes.ts :
 *   { path: 'liste-dossiers', component: ListeDossiers, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = localStorage.getItem('token');

  if (token) return true;

  router.navigate(['/login']);
  return false;
};