# use node:16 as base image
FROM node:16

# Stablish the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Expose the port 3000
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]