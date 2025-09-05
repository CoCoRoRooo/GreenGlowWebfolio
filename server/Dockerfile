FROM node:20-alpine
WORKDIR /app


# Dépendances système utiles
RUN apk add --no-cache bash openssl netcat-openbsd


# Installer deps
COPY package*.json ./
RUN npm ci --only=production


# Prisma (génération client + migrations/seed présents dans l'image)
COPY prisma ./prisma
RUN npx prisma generate


# Code
COPY src ./src
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh


EXPOSE 5000
ENV NODE_ENV=production
CMD ["./entrypoint.sh"]