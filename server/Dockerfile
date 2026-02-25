FROM node:18-alpine

# Workspace Setup
# Workspace Setup
WORKDIR /app

# Install system dependencies (Git and Chromium for Puppeteer)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git

# Set Puppeteer to skip downloading Chromium and use the installed one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Dependencies
COPY package*.json ./
RUN npm install --production

# App Source
COPY . .

# Environment Defaults
ENV NODE_ENV=production
ENV PORT=3000

# Expose Port
EXPOSE 3000

# Start Command
CMD ["npm", "start"]
