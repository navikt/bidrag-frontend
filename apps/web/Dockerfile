FROM node:26-alpine AS builder
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate
WORKDIR /app

# Setup registries (kept here so private packages can be resolved during install)
RUN npm set registry https://registry.npmjs.org/ \
    && npm set @navikt:registry https://npm.pkg.github.com \


# Kopier workspace-manifester og lockfil for optimal layer-caching av install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/
COPY packages/api/package.json packages/api/

RUN --mount=type=secret,id=reader_token \
        npm config set //npm.pkg.github.com/:_authToken=$(cat /run/secrets/reader_token) \
    && pnpm install --frozen-lockfile

# Kopier kildekode etter install for å unngå cache-bust på kodeendringer
COPY apps/web/ apps/web/
COPY packages/ packages/

RUN pnpm --filter web build

# Lager et selvstendig, flatt node_modules med kun produksjonsavhengigheter
RUN pnpm pnpm --filter web --prod deploy /app/deploy

FROM gcr.io/distroless/nodejs26-debian13:nonroot
WORKDIR /app

COPY --from=builder /app/deploy .

CMD ["node_modules/@react-router/serve/bin.js", "./build/server/index.js"]
