import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function datasetSaverPlugin(): Plugin {
  return {
    name: 'dataset-saver-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-dataset', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { filename, base64Data } = JSON.parse(body);
              const dir = path.resolve(process.cwd(), 'datasets');
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }

              if (base64Data) {
                const buffer = Buffer.from(base64Data, 'base64');
                const targetFile = path.join(dir, filename || 'KinetiQ_Dataset.xlsx');
                fs.writeFileSync(targetFile, buffer);
                fs.writeFileSync(path.join(dir, 'KinetiQ_Dataset_Latest.xlsx'), buffer);
                console.log(`[DatasetSaver] Saved Excel dataset to ${targetFile}`);
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, folder: dir }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), datasetSaverPlugin()],
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
});

