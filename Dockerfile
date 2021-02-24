FROM node:14-alpine3.10
WORKDIR /usr/src/app
COPY ./package*.json ./
RUN npm i
COPY ./src ./src
COPY ./tsconfig.json .
EXPOSE 8080
CMD [ "npm", "start" ]