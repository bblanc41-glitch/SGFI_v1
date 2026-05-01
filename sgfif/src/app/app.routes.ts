import { Routes } from '@angular/router';
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
];

//import { Routes } from '@angular/router';
/*import { Login } from './src/app/components/login/login';
import { ListeDossiers } from './src/app/components/liste-dossiers/liste-dossiers';
import { SaisieDossier } from './src/app/components/saisie-dossier/saisie-dossier';
import { Importation } from './src/app/components/importation/importation';
*/

/*
import { Login } from './components/login/login';
import { ListeDossiers } from './components/liste-dossiers/liste-dossiers';
import { SaisieDossier } from './components/saisie-dossier/saisie-dossier';
import { Importation } from './components/importation/importation';

export const routes: Routes = [
    {path: 'login', component:Login},
    {path:'liste-dossiers', component: ListeDossiers},
    {path: 'saisie-manuelle', component: SaisieDossier},
    {path: 'importation',component: Importation},
    {path:'', redirectTo:'/login',pathMatch:'full'}// Redirection par défaut vers la connexion
];
*/

