import { Routes } from '@angular/router';
import { Home } from './home/home';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
  { path: '', component: Home, title: 'Personal site' },
  // Prerendered to 404.html by scripts/postbuild.mjs (Angular does not prerender '**').
  { path: '404', component: NotFound, title: 'Page not found' },
  { path: '**', component: NotFound, title: 'Page not found' },
];
