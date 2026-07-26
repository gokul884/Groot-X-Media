import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {minify} from 'html-minifier-terser';

function htmlMinifierPlugin(): Plugin {
  return {
    name: 'vite-plugin-html-minification',
    enforce: 'post',
    async transformIndexHtml(html: string) {
      try {
        return await minify(html, {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true,
        });
      } catch (err) {
        console.warn('[HTML Minifier] Error during HTML minification:', err);
        return html;
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      htmlMinifierPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          designSystem: path.resolve(__dirname, 'design-system.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          pricing: path.resolve(__dirname, 'pricing.html'),
          blogPost: path.resolve(__dirname, 'blog-post.html'),
          blog: path.resolve(__dirname, 'blog.html'),
          testimonials: path.resolve(__dirname, 'testimonials.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('react') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
