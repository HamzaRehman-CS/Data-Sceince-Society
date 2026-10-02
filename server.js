'use strict';
const fs = require('node:fs'), path = require('node:path');
for (const name of ['.env', '.env.local']) {
  const envFile = path.join(__dirname, name);
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
}
require('./backend');
