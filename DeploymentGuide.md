# SummitCare Deployment Guide

## Overview

This guide explains how to deploy SummitCare in both **local
development** and **VPS production** environments using: - Vite + React
frontend - Express backend (`server/index.js`) - PM2 process manager -
NGINX reverse proxy

------------------------------------------------------------------------

## 1. Environment Files

### Local Development

Use `.env.local` for local machine runtime:

    VITE_API_BASE=http://127.0.0.1:3003
    API_PORT=3003
    NODE_ENV=development

    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_USER=summitcare_admin
    DB_PASS=YOUR_LOCAL_DB_PASSWORD
    DB_NAME=summitcare

### Shared Defaults

`.env` (optional but recommended)

    NODE_ENV=development

### VPS Server Environment (`server/.env`)

    NODE_ENV=production
    API_PORT=3003

    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_USER=summitcare_prod
    DB_PASS=YOUR_VPS_DB_PASSWORD
    DB_NAME=summitcare

------------------------------------------------------------------------

## 2. NGINX Reverse Proxy (VPS)

Place in `/etc/nginx/sites-available/summitcare.conf`:

    server {
        listen 80;
        server_name yourdomain.com;

        location / {
            proxy_pass http://127.0.0.1:3000;
        }

        location /api/ {
            proxy_pass http://127.0.0.1:3003;
        }
    }

Enable + reload:

    sudo ln -s /etc/nginx/sites-available/summitcare.conf /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx

------------------------------------------------------------------------

## 3. PM2 Process Setup (VPS)

### Start the API:

    pm2 start server/index.js --name summitcare-api

### Start the frontend:

    pm2 start "npm run preview" --name summitcare-web

### Save processes:

    pm2 save
    pm2 startup

------------------------------------------------------------------------

## 4. Deployment Workflow (GitHub → VPS)

### On VPS:

    cd /opt/summitcare
    git fetch --all
    git reset --hard origin/main
    npm install
    npm run build
    pm2 restart all

------------------------------------------------------------------------

## 5. Test API & Frontend

### Test API:

    curl http://127.0.0.1:3003/api/health

### Test frontend:

    curl -I http://127.0.0.1:3000

------------------------------------------------------------------------

## 6. Troubleshooting

### Check logs:

    pm2 logs summitcare-api
    pm2 logs summitcare-web

### Restart everything:

    pm2 restart all

------------------------------------------------------------------------
