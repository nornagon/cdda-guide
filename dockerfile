# Use a Node.js base image
FROM node:slim

# Set the working directory in the container
WORKDIR /cdda-guide

# Install git
RUN apt-get update && apt-get install -y git

# Clone the specific repository
RUN git clone https://github.com/DoiiarX/cdda-guide /cdda-guide

# Install dependencies using yarn
RUN yarn install

# Set the environment variable for the port
ENV PORT=3000

# Expose the port
EXPOSE $PORT

# Command to run the application
CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "3000"]

# use this command to build image 
# docker build -t cdda-guide .
