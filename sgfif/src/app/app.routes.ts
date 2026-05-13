import { Routes } from '@angular/router';
import { Login }         from './components/login/login';
import { Dashboard }     from './components/dashboard/dashboard';
import { ListeDossiers } from './components/liste-dossiers/liste-dossiers';
import { SaisieDossier } from './components/saisie-dossier/saisie-dossier';
import { Importation }   from './components/importation/importation';
import { authGuard }     from './guards/auth-guard';
import { DetailDossier } from './components/detail-dossier/detail-dossier';

export const routes: Routes = [
  { path: 'login',          component: Login                                        },
  { path: 'dashboard',      component: Dashboard,     canActivate: [authGuard]      },
  { path: 'liste-dossiers', component: ListeDossiers, canActivate: [authGuard]      },
  { path: 'saisie-manuelle',component: SaisieDossier, canActivate: [authGuard]      },
  { path: 'importation',    component: Importation,   canActivate: [authGuard]      },
  { path: 'dossier-detail/:id', component: DetailDossier, canActivate: [authGuard] },
  { path: '',               redirectTo: '/login',     pathMatch: 'full'             },
  { path: '**',             redirectTo: '/login'                                    },
];




/*import { Routes } from '@angular/router';
import { Login }         from './components/login/login';
import { Dashboard }     from './components/dashboard/dashboard';
import { ListeDossiers } from './components/liste-dossiers/liste-dossiers';

// a modifier import { SaisieDossier } from './components/saisie-dossier/saisie-dossier';
import { Importation }   from './components/importation/importation';
import { authGuard } from './guards/auth-guard';
export const routes: Routes = [
  // Publique
  { path: 'login', component: Login },

  // Protégées (JWT obligatoire)
  { path: 'dashboard',       component: Dashboard,     canActivate: [authGuard] },
  { path: 'liste-dossiers',  component: ListeDossiers, canActivate: [authGuard] },
 // a modifier { path: 'saisie-manuelle', component: SaisieDossier, canActivate: [authGuard] },
  { path: 'importation',     component: Importation,   canActivate: [authGuard] },

  // Redirection par défaut
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];*/
