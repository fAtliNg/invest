FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

# Create uploads directory and set permissions
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 5002

CMD ["node", "src/index.js"]
