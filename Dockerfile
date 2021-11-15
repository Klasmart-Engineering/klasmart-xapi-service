FROM node:lts-alpine
WORKDIR /usr/src/app
COPY ./dist ./dist
COPY ./node_modules ./node_modules
COPY ./src/schema.graphql ./src/schema.graphql
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD node dist/index.js