# Pull base image.
FROM ubuntu:14.04 
MAINTAINER Madhusudan Abburu "madhu.abburu@gmail.com" 

# install our dependencies and nodejs
RUN echo "deb http://archive.ubuntu.com/ubuntu precise main universe" > /etc/apt/sources.list
RUN apt-get update
RUN apt-get update --fix-missing

RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup | sudo bash -

RUN apt-get -y install git make 
RUN apt-get -y install python nodejs 

RUN npm install -g npm@latest
RUN npm update
RUN apt-get update --fix-missing

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
WORKDIR /opt/app
ADD . /opt/app

EXPOSE  8080

CMD ["node", "server.js"]
