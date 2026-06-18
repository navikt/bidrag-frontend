FROM gcr.io/distroless/nodejs26-debian13:nonroot
WORKDIR /app

COPY deploy_dist/ .

CMD ["./node_modules/@react-router/serve/bin.cjs", "./build/server/index.js"]
