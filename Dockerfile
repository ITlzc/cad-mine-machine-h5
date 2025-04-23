# 使用 Node.js 18 Alpine 版本
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

# ✅ 复制 .env.local 确保 Next.js 可以访问
COPY .env.local .env.local

# ✅ 明确使用 cross-env 确保 Next.js 读取环境变量
RUN NODE_ENV=production npm run build


# 运行时环境
FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.local .env.local

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
