# ============================================
# Stage 1: build - install semua dependency (termasuk devDependencies
# yang dibutuhkan Vite untuk build frontend) lalu build dist/
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy manifest dulu (bukan seluruh source) supaya layer ini di-cache
# oleh Docker selama package.json tidak berubah -> rebuild jauh lebih cepat.
COPY package*.json ./
RUN npm ci

# Baru copy seluruh source code, lalu build frontend Vue -> dist/
COPY . .
RUN npm run build

# ============================================
# Stage 2: production - image final, cuma bawa yang perlu jalan
# (server.js, node_modules produksi, dan hasil build dist/)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Source backend
COPY server.js db.js ./
COPY routes ./routes
COPY middleware ./middleware
COPY utils ./utils
COPY public ./public

# Hasil build frontend dari stage 'build' (bukan dari devDependencies-nya)
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]