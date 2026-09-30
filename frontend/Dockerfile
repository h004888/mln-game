# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build argument for public backend URL
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

COPY package*.json tsconfig*.json next.config.js tailwind.config.js postcss.config.js ./
RUN npm ci

COPY public ./public
COPY src ./src

RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start"]
