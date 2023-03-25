FROM ghcr.io/puppeteer/puppeteer:latest

USER root
# Install dependencies
COPY . .
RUN npm ci

# Run the app
CMD [ "npm", "start" ]