FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:26-slim
WORKDIR /app

COPY deploy_dist/ .

CMD ["./node_modules/@react-router/serve/bin.cjs", "./build/server/index.js"]
