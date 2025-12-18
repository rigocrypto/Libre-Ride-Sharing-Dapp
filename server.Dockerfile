FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* package-lock.json* ./

RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else npm install --omit=dev; fi

COPY . .

WORKDIR /app/server

EXPOSE 5000

CMD ["pnpm", "dev"]





