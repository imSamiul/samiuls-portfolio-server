FROM node:22-alpine

WORKDIR /app

RUN corepack enable

# Dependencies are their own layer so source edits don't reinstall them.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# TypeScript is executed directly by tsx, the same way `pnpm start` runs locally.
ENV NODE_ENV=production
EXPOSE 4000

CMD ["pnpm", "start"]
