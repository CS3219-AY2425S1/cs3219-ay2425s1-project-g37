FROM node:20 AS raw

RUN npm install -g bun
ENV PATH="$PATH:/root/.bun/bin"
