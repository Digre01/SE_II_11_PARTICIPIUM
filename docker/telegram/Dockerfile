# Telegram Bot Dockerfile (development-friendly)

FROM node:latest


WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy source code
COPY . .


CMD ["npm", "start"]

