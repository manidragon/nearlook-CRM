const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3005', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.on('error', (err) => {
    console.error('HTTP server error:', err);
  });

  server.listen(port, hostname, () => {
    console.log(`> Nearlook Agency ERP running on http://${hostname}:${port}`);
  });

  // Keep process alive
  setInterval(() => { }, 1000 * 60 * 60);
}).catch((err) => {
  console.error('Error preparing Next app:', err);
  process.exit(1);
});
