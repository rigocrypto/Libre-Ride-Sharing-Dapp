FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* package-lock.json* ./

RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else npm install; fi

COPY . .

WORKDIR /app/client

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]





