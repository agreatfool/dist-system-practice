FROM node:10.15.3-alpine

WORKDIR /app
COPY index.js ./

ENV PORT 8098

ENTRYPOINT ["/usr/local/bin/node", "index.js"]