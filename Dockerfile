# ---------- Стадия сборки ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Копируем только зависимости чтобы кешировать слои
COPY package.json package-lock.json ./

# Устанавливаем зависимости, разрешая peer-deps конфликты (для next-auth)
RUN npm install --legacy-peer-deps

# Копируем остальной код
COPY . .

# Продакшн-сборка Next.js
RUN npm run build

# ---------- Стадия запуска ----------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Создаём пользователя (чистая безопасность)
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 nextjs

# Копируем артефакты сборки
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
