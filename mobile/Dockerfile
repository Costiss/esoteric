# Development Dockerfile for mobile app
FROM node:20-bookworm

# Install watchman (required for React Native/Expo)
RUN apt-get update && apt-get install -y \
    watchman \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Expo CLI globally
RUN npm install -g expo-cli@latest

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Default command starts Expo
CMD ["npx", "expo", "start", "--tunnel"]
