FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

USER node

EXPOSE 5005

CMD ["npm", "start"]
