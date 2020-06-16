const http = require('http');

function httpServerHook({ port, listNumClientsPerChannel }) {
  http
    .createServer((_, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(listNumClientsPerChannel()));
    })
    .listen(port, () => {
      console.log(`... and on :${port} for http channel counts`);
    });
}

module.exports = httpServerHook;
