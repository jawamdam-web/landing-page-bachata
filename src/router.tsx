import { createBrowserRouter } from 'react-router';
import App from './App';

/**
 * Router skeleton — IU-1 placeholder, jedna trasa `/`.
 * IU-3+ (landing) i IU-4+ (auth) dodadzą kolejne trasy + nested routes.
 *
 * Decyzja: React Router 7 (nie TanStack Router) — patrz raport IU-1.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
]);
