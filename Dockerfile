# --- Этап 1: Сборка (Builder) ---
# Используем образ Node.js для сборки приложения
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы манифеста и устанавливаем зависимости
# ВНИМАНИЕ: Копируем package-lock.json (для npm)
COPY package.json package-lock.json ./
# Используем npm ci для установки зависимостей из лок-файла
RUN npm ci --prefer-offline

# Копируем исходный код
COPY . .

# Запускаем сборку Next.js
# output: 'standalone' создает папку .next/standalone
RUN npm run build

# --- Этап 2: Продакшен (Runner) ---
# Используем минимальный образ для продакшена для уменьшения размера
FROM node:20-alpine AS runner

# Для безопасности не запускаем от имени root
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs
USER nextjs

WORKDIR /app

# Копируем только необходимые файлы из этапа builder:
# 1. Папку 'standalone' (включает .next/static и node_modules)
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./

# 2. Папку 'public'
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

# Убедитесь, что переменная NODE_ENV установлена в production
ENV NODE_ENV production
# Next.js по умолчанию запускается на порту 3000
ENV PORT 3000

# Открываем порт
EXPOSE 3000

# Запуск приложения (next build в режиме standalone генерирует 'server.js')
CMD ["node", "server.js"]