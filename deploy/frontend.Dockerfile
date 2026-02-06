FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_IS_DEV
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_IS_DEV=$NEXT_PUBLIC_IS_DEV
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
