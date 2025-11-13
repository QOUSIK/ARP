# Production Deployment (Critical Checklist)

- Remove `.env` and `node_modules` from the release package.
- Create a root-owned env file (e.g., `/etc/arp.env`) with permissions 600. See `deploy/ENV.example`.
- Set `NODE_ENV=production`, `JWT_SECRET` (64 hex), `ADMIN_EMAIL`, `ADMIN_PASS_HASH` (bcrypt), and restrict `CORS_ORIGINS` to your domains.
- Run behind Nginx using `deploy/nginx.conf` (nosniff + limited types for `/uploads`, cache static assets).
- Optional/temporary: enable site-wide Basic Auth for staging or protected prod. See `deploy/nginx.conf` (auth_basic + auth_basic_user_file).
- Start the app via systemd using `deploy/arp.service` (adjust `WorkingDirectory`, set `EnvironmentFile=/etc/arp.env`, service user).
- Ensure the service user owns and can write to `public/uploads` and `server/database.sqlite`.
- Initialize DB once: `npm ci && npm run db:init`.

## Notes
- `server/index.js` trusts the first proxy (`app.set('trust proxy', 1)`) and sets strict headers for `/uploads` to prevent script execution.
- `client_max_body_size` in Nginx is set to `6m` to align with a 5 MB upload limit in the app.

## Basic Auth (setup)
Create a password file once on the server (replace `admin` and set your password):

```
sudo apt-get update && sudo apt-get install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

Or without apache2-utils (OpenSSL APR1 hash):

```
printf "admin:$(openssl passwd -apr1 'YourStrongPass')\n" | sudo tee /etc/nginx/.htpasswd >/dev/null
```

Reload Nginx:

```
sudo nginx -t && sudo systemctl reload nginx
```
