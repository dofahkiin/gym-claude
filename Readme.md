<a href="https://www.flaticon.com/free-icons/gym" title="gym icons">Gym icons created by justicon - Flaticon</a>

Run tests in backend: `npm test`
Run tests in frontend (Vite/Vitest): `npm run test`

Deploy backend: `pm2 start backend`
Deploy frontend (Vite build): `npm run build` then `cp -R dist/* /usr/share/nginx/html/gym/`

Full test sweep: `(cd frontend && npm run test) && (cd backend && npm test)`
