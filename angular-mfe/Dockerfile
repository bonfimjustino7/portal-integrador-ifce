FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY angular.json tsconfig*.json server.js ./
COPY src ./src

RUN npm run build

EXPOSE 4201

CMD ["npm", "run", "serve"]
