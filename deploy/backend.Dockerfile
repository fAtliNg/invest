FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Use non-root user for security
USER node

EXPOSE 5001

CMD ["npm", "start"]
