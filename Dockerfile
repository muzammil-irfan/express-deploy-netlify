# Use an official Node.js image
FROM node:18-bullseye

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the Netlify function port
EXPOSE 8888

# Start the Netlify dev server
CMD ["npx", "netlify-cli", "dev"]
