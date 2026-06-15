FROM gcr.io/distroless/nodejs26-debian13:nonroot

WORKDIR /app

COPY build/ build/
COPY ./package.json ./
COPY node_modules/ node_modules/

CMD ["node_modules/@react-router/serve/bin.js", "./build/server/index.js"]
