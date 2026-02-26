FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install deps
COPY package.json ./
RUN pnpm install

# Copy source
COPY . .

# Start: run migrations then server
CMD sh -c "pnpm db:migrate && pnpm start"
