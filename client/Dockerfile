FROM node:20-bookworm-slim AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=https://remise.digital
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ libvips-dev \
    && rm -rf /var/lib/apt/lists/* \
    && npm ci

COPY . .
RUN npm run build
RUN npm prune --production

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app .
EXPOSE 4000
CMD ["npm", "start"]
