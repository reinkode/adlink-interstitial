import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route to proxy the JSON configuration
  app.get('/api/config', async (req, res) => {
    try {
      const jsonSource = process.env.JSON_SOURCE;
      
      if (!jsonSource) {
        return res.json({ source: 'local', url: '/links.json' });
      }

      if (jsonSource.startsWith('/')) {
         return res.json({ source: 'local', url: jsonSource });
      }

      // Normalize URL for common file hosts
      let targetUrl = jsonSource;
      
      // Google Drive Viewer -> Export
      const driveMatch = targetUrl.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
      if (driveMatch) {
        targetUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
      }

      // Dropbox Share -> Raw
      if (targetUrl.includes('dropbox.com') && targetUrl.includes('dl=0')) {
        targetUrl = targetUrl.replace('dl=0', 'raw=1');
      }

      console.log(`Proxying config from: ${targetUrl}`);
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json({ source: 'proxy', data });
      } catch (e) {
        console.error('Failed to parse JSON. Response start:', text.substring(0, 100));
        throw new Error(`Invalid JSON response from source. content-type: ${response.headers.get('content-type')}`);
      }
      
    } catch (error) {
      console.error('Config proxy error:', error);
      res.status(500).json({ 
        error: 'Failed to load configuration',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // API Route to validate if a link is embeddable
  app.get('/api/validate-link', async (req, res) => {
    let { url } = req.query;
    if (typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };

      // Fetch with redirect following
      const response = await fetch(url, { method: 'GET', redirect: 'follow', headers });
      
      // Check final URL against known blockers
      const finalUrl = response.url.toLowerCase();
      const knownBlockers = [
        'traveloka.com', 'shopee', 'lazada', 'amazon', 'google', 'facebook', 'instagram', 'twitter', 'x.com', 'tiktok', 'youtube'
      ];
      
      if (knownBlockers.some(blocker => finalUrl.includes(blocker))) {
        console.log(`Blocked domain detected in final URL: ${finalUrl}`);
        return res.json({ embeddable: false, reason: 'Known blocking domain' });
      }

      const xFrameOptions = response.headers.get('x-frame-options')?.toLowerCase();
      const csp = response.headers.get('content-security-policy')?.toLowerCase();

      // Check Headers
      if (xFrameOptions === 'deny' || xFrameOptions === 'sameorigin') {
        return res.json({ embeddable: false, reason: 'X-Frame-Options' });
      }

      if (csp && csp.includes('frame-ancestors')) {
        if (csp.includes("'none'") || csp.includes("'self'")) {
          return res.json({ embeddable: false, reason: 'CSP' });
        }
      }

      // Check for Client-Side Redirects (Meta Refresh or JS)
      // Only check if content type is HTML
      const contentType = response.headers.get('content-type')?.toLowerCase();
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        
        // Check for Meta Refresh
        if (text.match(/<meta\s+http-equiv=["']?refresh["']?\s+content=/i)) {
           return res.json({ embeddable: false, reason: 'Meta Refresh detected' });
        }

        // Check for common JS redirects (simple heuristic)
        // We look for window.location assignment in the first 2k chars which is typical for redirectors
        const headSnippet = text.substring(0, 2000).toLowerCase();
        if (headSnippet.includes('window.location') || headSnippet.includes('top.location') || headSnippet.includes('self.location')) {
           // This is aggressive, but safer for SmartLinks which are almost always redirects
           // If it's a SmartLink (tracker), it shouldn't be embedded if it redirects to a blocked site.
           // Since we can't know where it goes, we assume it might be unsafe if it's a JS redirect.
           // However, many valid sites use window.location. 
           // Let's refine: look for immediate assignment
           if (headSnippet.match(/(window|top|self)\.location(\.href)?\s*=\s*['"`]/) || 
               headSnippet.match(/(window|top|self)\.location\.replace\(/)) {
               return res.json({ embeddable: false, reason: 'JS Redirect detected' });
           }
        }
      }

      res.json({ embeddable: true });

    } catch (error) {
      console.error('Link validation error:', error);
      // If we can't reach it, it's safer to force new tab (could be geo-blocked or bot-blocked)
      res.json({ embeddable: false, error: 'Validation failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: 'all' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files
    app.use(express.static('dist'));
    // SPA fallback for client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
