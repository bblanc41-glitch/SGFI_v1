import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter }                          from '@angular/router';
import { provideHttpClient, withInterceptors }    from '@angular/common/http';
import { provideAnimationsAsync }                 from '@angular/platform-browser/animations/async';

import { routes }         from './app.routes';
import { jwtInterceptor } from './services/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),                          // ← Angular Material animations
    provideHttpClient(withInterceptors([jwtInterceptor])) // ← JWT sur tous les appels HTTP
  ]
};

/* Version 2.
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
//                           ↑ CRITIQUE : withInterceptors() est la façon
//                             moderne d'enregistrer un intercepteur fonctionnel.
//                             Sans ça, jwtInterceptor n'est jamais appelé
//                             et aucune requête ne portera le token JWT.

import { routes } from './app.routes';
//import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { jwtInterceptor } from './services/jwt.interceptor';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // L'intercepteur JWT est injecté ici → il s'applique à TOUS les appels HTTP
    provideHttpClient(withInterceptors([jwtInterceptor]))
  ]
};*/


/*import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './services/jwt.interceptor'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])) 
  ]
};*/

/*import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { jwtInterceptor } from './services/jwt.interceptor'; // Importe ton nouvel intercepteur
import { provideHttpClient, withInterceptors } from '@angular/common/http'; //
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])) // On active l'intercepteur ici
  ]
};
*/