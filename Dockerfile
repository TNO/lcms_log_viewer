# Creates the l3.
#
# You can access the container using:
#   docker run --rm -it -p 8888:3000 -v ./db:/app/db l3crisis sh
# To start it stand-alone:
#   docker run --rm -it -p 8888:3000 -v ./db:/app/db l3crisis

FROM nikolaik/python-nodejs as builder
RUN mkdir -p ./code
WORKDIR /code
COPY package.json ./
RUN npm i
COPY ./src ./src
COPY tsconfig.json rspack.config.js ./
RUN npm run build

FROM node:18-alpine
RUN mkdir -p /app/cache
RUN mkdir -p /app/db
WORKDIR /app
COPY --from=builder /code/public ./public
COPY package*.json ./
RUN npm i --omit=dev
CMD ["npm", "run", "serve"]
