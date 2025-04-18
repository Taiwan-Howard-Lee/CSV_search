# SBC Gina Search Engine Dockerfile
FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Build the TypeScript code
RUN npm run build

# Create necessary directories
RUN mkdir -p logs results

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
