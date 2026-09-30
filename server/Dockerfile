# Backend Centinela — Node + LibreOffice (para exportar el BIE a PDF en Linux,
# donde no existe Word). Build context = carpeta server/.
#   docker build -t centinela-api ./server
FROM node:22-bookworm-slim

# LibreOffice headless (conversión .docx→PDF) + fuentes para acentos/tildes.
RUN apt-get update \
  && apt-get install -y --no-install-recommends libreoffice-writer fonts-dejavu ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

# Solo dependencias de producción (incluye tsx como runtime; sin vitest/eslint/drizzle-kit).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Código y recursos del servidor.
COPY tsconfig.json ./
COPY src ./src
COPY drizzle ./drizzle
COPY assets ./assets

# Carpeta de archivos local (si NO se usa R2). En hosts efímeros (Fly/Koyeb) usa R2.
RUN mkdir -p /app/storage

EXPOSE 8787
# Las variables (AUTH_SECRET, TURSO_*, R2_*, CORS_ORIGIN, IMAP_MAILBOXES, …) se
# inyectan desde el panel del host, NO se copian al imagen.
CMD ["npx", "tsx", "src/server.ts"]
