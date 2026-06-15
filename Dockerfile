FROM node:17

COPY . ./

ENV NODE_ENV="production"

EXPOSE 8080

CMD node server.js