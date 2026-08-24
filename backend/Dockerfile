FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# We expose the default port (can be overridden by environment variable)
EXPOSE 10000

CMD ["npm", "run", "dev"]
