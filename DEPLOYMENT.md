# SBC Gina Search Engine Deployment Guide

This guide provides instructions for deploying the SBC Gina Search Engine in a production environment.

## Prerequisites

- Node.js (version 14 or higher)
- npm (usually comes with Node.js)
- Git
- A server or cloud instance (Linux recommended)

## Deployment Options

### Option 1: Basic Deployment

This is the simplest deployment method, suitable for personal use or small teams.

1. Clone the repository:
   ```bash
   git clone https://github.com/Taiwan-Howard-Lee/CSV_search.git
   cd CSV_search
   ```

2. Run the installation script:
   ```bash
   ./install.sh
   ```

3. Configure the search engine by editing `config.json`:
   ```bash
   nano config.json
   ```
   
   Update the host and port settings:
   ```json
   {
     "server": {
       "port": 80,
       "host": "0.0.0.0"
     },
     ...
   }
   ```
   
   Note: Using port 80 requires root privileges. You might need to use a higher port (e.g., 3000) and set up a reverse proxy.

4. Start the server:
   ```bash
   ./start.sh
   ```

5. (Optional) Set up the server to start automatically on boot using a systemd service:
   
   Create a service file:
   ```bash
   sudo nano /etc/systemd/system/sbc-gina.service
   ```
   
   Add the following content (adjust paths as needed):
   ```
   [Unit]
   Description=SBC Gina Search Engine
   After=network.target

   [Service]
   Type=simple
   User=your_username
   WorkingDirectory=/path/to/CSV_search
   ExecStart=/usr/bin/node /path/to/CSV_search/server.js
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```
   
   Enable and start the service:
   ```bash
   sudo systemctl enable sbc-gina
   sudo systemctl start sbc-gina
   ```

### Option 2: Using Docker

For a more isolated and portable deployment, you can use Docker.

1. Create a Dockerfile in the project root:
   ```bash
   nano Dockerfile
   ```
   
   Add the following content:
   ```dockerfile
   FROM node:16-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .
   RUN npm run build

   EXPOSE 3000

   CMD ["node", "server.js"]
   ```

2. Build the Docker image:
   ```bash
   docker build -t sbc-gina .
   ```

3. Run the Docker container:
   ```bash
   docker run -p 80:3000 -d --name sbc-gina sbc-gina
   ```

### Option 3: Using a Process Manager (PM2)

For better process management and monitoring, you can use PM2.

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the application with PM2:
   ```bash
   pm2 start server.js --name "sbc-gina"
   ```

3. Set up PM2 to start on boot:
   ```bash
   pm2 startup
   pm2 save
   ```

4. Monitor the application:
   ```bash
   pm2 monit
   ```

## Setting Up a Reverse Proxy

For better security and performance, it's recommended to use a reverse proxy like Nginx.

### Nginx Configuration

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Create a new Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/sbc-gina
   ```
   
   Add the following content:
   ```
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Enable the configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sbc-gina /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Setting Up HTTPS

For secure connections, it's recommended to set up HTTPS using Let's Encrypt.

1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obtain and install a certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. Set up automatic renewal:
   ```bash
   sudo systemctl status certbot.timer
   ```

## Monitoring and Maintenance

### Logs

Application logs are stored in the `logs` directory. You can view them using:
```bash
tail -f logs/app.log
```

### Backups

Regularly back up your configuration and results:
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz config.json results/
```

### Updates

To update the application:
```bash
git pull
npm install
npm run build
```

If using PM2:
```bash
pm2 restart sbc-gina
```

## Scaling

For higher traffic, consider:

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Vertical Scaling**: Increase server resources (CPU, RAM)
3. **Database Caching**: Implement Redis for caching search results
4. **CDN**: Use a Content Delivery Network for static assets

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Permission denied**:
   ```bash
   chmod +x *.sh
   ```

3. **Node.js version issues**:
   ```bash
   nvm install 16
   nvm use 16
   ```

### Getting Help

If you encounter issues, check:
1. The application logs in the `logs` directory
2. Open an issue on GitHub: https://github.com/Taiwan-Howard-Lee/CSV_search/issues
