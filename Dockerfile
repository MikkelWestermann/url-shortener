FROM node:dubnium

WORKDIR /usr/src/url-shortener

COPY ./ ./

RUN npm install

CMD [ "/bin/bash" ]