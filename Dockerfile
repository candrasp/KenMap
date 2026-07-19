# Gunakan base image Node.js versi 20 yang lengkap dengan build-essential
# untuk keperluan compile better-sqlite3 native bindings.
FROM node:20 AS builder

WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install dependensi (termasuk devDependencies untuk build Vite)
RUN npm ci

# Salin seluruh kode proyek
COPY . .

# Jalankan build frontend (Vite menghasilkan folder dist/)
RUN npm run build

# --- Stage Runtime ---
FROM node:20-slim AS runner

WORKDIR /app

# Install runtime dependencies jika diperlukan (seperti openssl, dll)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Salin package files
COPY package*.json ./

# Install hanya dependensi production (better-sqlite3 akan dicompilasi ulang untuk slim image)
# Kita butuh compiler tools sementara untuk build better-sqlite3 di stage ini
RUN apt-get update && apt-get install -y python3 make g++ \
    && npm ci --only=production \
    && apt-get purge -y python3 make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Salin file server dan asset statis hasil build dari builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/db.js ./db.js
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/utils ./utils

# Buat folder khusus data untuk menyimpan database SQLite secara persisten
RUN mkdir -p /app/data

# Environment variables default
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/ftth.db

EXPOSE 3000

# Jalankan server
CMD ["node", "server.js"]
