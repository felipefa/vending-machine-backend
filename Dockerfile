FROM node:18-slim

WORKDIR /app

COPY . /app

RUN npm install -g pnpm
RUN pnpm install

ENV PORT 3000

EXPOSE 3000

CMD [ "pnpm", "dev" ]
