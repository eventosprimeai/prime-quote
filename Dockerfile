FROM node:20-alpine AS base

# 1. Dependencias de sistema necesarias para Prisma
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 2. Instalar dependencias
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Omitir postinstall script para evitar que Prisma falle sin código
RUN npm ci --ignore-scripts

# 3. Construir la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma explícitamente y transpilar Next.js
RUN npx prisma generate
RUN npm run build

# 4. Imagen final de Producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear usuario sin privilegios por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar configuración, assets y build standalone
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Utilizar el script genérico que levanta server.js (standalone)
USER nextjs

EXPOSE 3002
ENV PORT 3002
ENV HOSTNAME "0.0.0.0"

# Importante: Como estamos en Alpine con Prisma, puede ser necesario 
# que al instanciar Prisma se defina correctamente el motor.
# El servidor inicial de Next.js (standalone)
CMD ["node", "server.js"]
