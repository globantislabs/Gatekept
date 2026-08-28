const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const run = (cmd, env = {}) => {
  console.log(`\n> Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
};

const copy = (src, dest) => {
  if (fs.existsSync(src)) {
    console.log(`Copying ${src} to ${dest}`);
    fs.cpSync(src, dest, { recursive: true });
  } else {
    console.log(`Skipping ${src} (not found)`);
  }
};

const mkdir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

try {
  console.log('🚀 Clearing old build cache...');
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }

  console.log('💿 Using MySQL schema...');
  run('npm run db:use-mysql');

  console.log('🔄 Safely syncing database schema (will abort if data loss is detected)...');
  let dbEnv = {};
  if (fs.existsSync('.env.production')) {
    const envFile = fs.readFileSync('.env.production', 'utf8');
    const dbUrlMatch = envFile.match(/^DATABASE_URL=(.*)$/m);
    if (dbUrlMatch) dbEnv.DATABASE_URL = dbUrlMatch[1].trim();
  }
  run('npx prisma db push', dbEnv);

  console.log('📦 Building Next.js...');
  run('npx next build');

  console.log('\n--- Copying standalone assets ---');
  copy('.next/static', '.next/standalone/.next/static');
  copy('public', '.next/standalone/public');
  copy('prisma', '.next/standalone/prisma');
  copy('node_modules/.prisma', '.next/standalone/node_modules/.prisma');
  copy('node_modules/@prisma', '.next/standalone/node_modules/@prisma');
  copy('node_modules/mysql2', '.next/standalone/node_modules/mysql2');

  if (fs.existsSync('.env.production')) {
    console.log('Copying .env.production to .next/standalone/.env.production');
    fs.copyFileSync('.env.production', '.next/standalone/.env.production');
  }

  console.log('\n--- Creating upload dirs ---');
  mkdir('.next/standalone/public/uploads/products');
  mkdir('.next/standalone/public/uploads/videos');
  mkdir('.next/standalone/public/uploads/audio');

  console.log('\n✅ Plesk build complete! The .next/standalone folder is ready to zip.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
