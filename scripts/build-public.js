const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const items = ['assets', 'css', 'dist', 'index.html', 'dashboard.html'];

async function copy(src, dest) {
  const stat = await fs.promises.stat(src);
  if (stat.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src);
    await Promise.all(entries.map((entry) => copy(path.join(src, entry), path.join(dest, entry))));
    return;
  }
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
}

(async () => {
  await fs.promises.rm(publicDir, { recursive: true, force: true });
  await fs.promises.mkdir(publicDir, { recursive: true });
  await Promise.all(items.map((item) => copy(path.join(root, item), path.join(publicDir, item))));
  console.log('✅ Successfully built public directory');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
