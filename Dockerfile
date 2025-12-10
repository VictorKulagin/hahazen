# ---------- Стадия сборки ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Сначала зависимости, чтобы кешировались
COPY package.json package-lock.json* ./
RUN npm install

# Потом весь код проекта
COPY . .

# Продакшн-сборка Next.js
RUN npm run build

# ---------- Стадия запуска ----------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Небольшая гигиена по пользователю
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 nextjs

# Копируем только нужное
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
