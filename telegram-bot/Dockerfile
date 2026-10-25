# Use official Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Run as non-root user
USER node

# Start bot
CMD ["npm", "start"]
