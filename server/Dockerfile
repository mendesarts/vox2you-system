FROM node:18-alpine

# Workspace Setup
WORKDIR /app

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
