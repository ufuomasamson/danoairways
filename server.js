import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Check if we're in development or production mode
const dev = process.env.NODE_ENV !== 'production';

// Initialize Next.js application
const app = next({ dev });
const handle = app.getRequestHandler();

// Define port - cPanel Node.js applications typically use a specific port
const port = process.env.PORT || 3000;

// Prepare the Next.js application
app.prepare().then(() => {
  // Create HTTP server
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Let Next.js handle the request
    handle(req, res, parsedUrl);
    
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Dano Airways application ready on http://localhost:${port}`);
    console.log(`> Mode: ${dev ? 'development' : 'production'}`);
  });
});
