# frontend/Dockerfile
# from node:18-alpine
FROM node:18-bullseye-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

EXPOSE 4173
CMD ["npm", "run", "preview"]
