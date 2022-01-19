FROM node:lts-alpine
WORKDIR /usr/app
COPY ./dist .
COPY ./node_modules ./node_modules
COPY ./src/schema.graphql ./src/schema.graphql
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD node src/index.js
