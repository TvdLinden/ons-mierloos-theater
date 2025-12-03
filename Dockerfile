# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port (Next.js default is 3000)
EXPOSE 3000

# Start Next.js
CMD ["npm", "run", "start"]
