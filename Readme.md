<a href="https://www.flaticon.com/free-icons/gym" title="gym icons">Gym icons created by justicon - Flaticon</a>

Run tests in backend: npm test
Run tests in frontend: CI=true npm test -- --runInBand --watchAll=false

Deploy backend pm2 start backend
Deploy frontend: npm run build; cp -R build/* /usr/share/nginx/html/gym/

(cd frontend && CI=true npm test -- --runInBand --watchAll=false) && (cd backend && npm test)