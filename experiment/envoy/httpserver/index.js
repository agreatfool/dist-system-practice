#!/usr/bin/env node

const http = require('http');
const port = process.env.PORT || 8098;

const server = http.createServer((request, response) => {
    const msg = `Server on port ${port} handling the request: ${request.url}`;

    console.log(msg);
    response.end(msg);
});
server.listen(port, (err) => {
    if (err) {
        return console.log('Err:', err);
    }

    console.log(`Server is listening on ${port}`);
});