// client/scripts/build_part1.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/client', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

// 1. vite.config.js
write('vite.config.js', `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
});
`);

// 2. postcss.config.js
write('postcss.config.js', `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);

// 3. tailwind.config.js
write('tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#171e19',
          charcoal: '#302b2f',
          sage: '#b7c6c2',
          taupe: '#9f8d8b',
          beige: '#d7c5b2',
          cyan: '#d5f4f9',
          blue: '#bbe2f5',
          light: '#fafafa',
          white: '#ffffff',
        }
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.35' },
        }
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'float-slow': 'float 12s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
`);

// 4. index.html
write('index.html', `
<!DOCTYPE html>
<html lang="en" class="h-full bg-brand-light text-brand-navy antialiased">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WrapAI — From Content to Clarity</title>
    <!-- Google Fonts: Anton & Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  </head>
  <body class="h-full bg-brand-light font-sans selection:bg-brand-navy selection:text-brand-white">
    <div id="root" class="h-full"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

// 5. src/index.css
write('src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-brand-light text-brand-navy font-sans antialiased overflow-x-hidden;
  }

  h1, h2, h3, h4, .font-display {
    letter-spacing: 0.02em;
  }
}

/* Custom minimal scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #fafafa;
}

::-webkit-scrollbar-thumb {
  background: #b7c6c2;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #302b2f;
}

/* Crosshair precision cursor for editorial sections */
.cursor-cross {
  cursor: crosshair;
}

/* Custom border styling */
.border-fine {
  border-width: 1px;
}
`);

// 6. src/utils/formatters.js
write('src/utils/formatters.js', `
export function formatTimecode(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00:00';
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;
  
  const pad = (num) => String(num).padStart(2, '0');
  return \`\${pad(hrs)}:\${pad(mins)}:\${pad(remainingSecs)}\`;
}

export function formatShortTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00';
  const sec = Math.floor(seconds);
  const mins = Math.floor(sec / 60);
  const remainingSecs = sec % 60;
  const pad = (num) => String(num).padStart(2, '0');
  return \`\${pad(mins)}:\${pad(remainingSecs)}\`;
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return \`\${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} \${sizes[i]}\`;
}

export function formatDate(isoDateString) {
  if (!isoDateString) return 'N/A';
  const d = new Date(isoDateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
`);

// 7. src/utils/validators.js
write('src/utils/validators.js', `
export const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i;
export const urlPattern = /^(https?:\\/\\/)?(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
`);

console.log('Part 1 configuration files generated successfully.');
