import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

const ROOT = process.cwd();
const templatePath = path.join(ROOT, '.env.template');
const localPath = path.join(ROOT, '.env.local');

function ensureLocalEnv() {
  // 1️⃣ Create .env.local if missing
  if (!fs.existsSync(localPath)) {
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Missing .env.template at project root.');
      process.exit(1);
    }
    fs.copyFileSync(templatePath, localPath);
    console.log('✅ Created .env.local from .env.template');
  } else {
    console.log('ℹ️  .env.local already exists');
  }

  // 2️⃣ Load and validate
  dotenv.config({ path: localPath });
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_SSL',
  ];

  let envContent = fs.readFileSync(localPath, 'utf8');
  const missing = requiredVars.filter((v) => !process.env[v]);

  // 3️⃣ Auto-generate DB_PASSWORD if missing
  if (missing.includes('DB_PASSWORD')) {
    const randomPassword = crypto.randomBytes(12).toString('base64url');
    envContent = envContent.replace(
      /^DB_PASSWORD=.*$/m,
      `DB_PASSWORD=${randomPassword}`
    );
    fs.writeFileSync(localPath, envContent);
    console.log(`🔐 Generated local DB_PASSWORD: ${randomPassword}`);
    missing.splice(missing.indexOf('DB_PASSWORD'), 1);
  }

  // 4️⃣ Summary table
  const tableRows = requiredVars.map((key) => {
    const value = process.env[key];
    const display =
      value && key !== 'DB_PASSWORD' ? value : value ? '••••••••' : '—';
    const status = value ? '✅' : '⚠️';
    return { Variable: key, Value: display, Status: status };
  });

  console.log('\n📋 Environment Variable Summary:');
  console.table(tableRows);

  // 5️⃣ Report missing
  if (missing.length > 0) {
    console.warn(`⚠️  Missing variables in .env.local:\n   ${missing.join('\n   ')}`);
  } else {
    console.log('✅ All required DB_* variables are set');
  }

  console.log('🧩 Environment setup complete.\n');
}

ensureLocalEnv();
