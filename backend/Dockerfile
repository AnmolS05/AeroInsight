FROM node:18-alpine

WORKDIR /app

# Set environment to production for optimized node behavior
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# We expose the default port (can be overridden by environment variable)
EXPOSE 10000

# Use standard node execution for production, bypassing nodemon
CMD ["npm", "start"]
