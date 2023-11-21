FROM node:18-slim

WORKDIR /app

COPY . /app

RUN npm install -g pnpm
RUN pnpm install

CMD [ "pnpm", "dev" ]
