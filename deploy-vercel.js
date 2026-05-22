const TOKEN = process.env.VERCEL_TOKEN || '';
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'user-app', 'dist');

async function uploadFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath);
  const isBinary = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp'].includes(path.extname(filePath).toLowerCase());
  
  if (isBinary) {
    return {
      file: content.toString('base64'),
      encoding: 'base64'
    };
  } else {
    return {
      file: content.toString('utf-8'),
      encoding: 'utf-8'
    };
  }
}

async function getAllFiles(dir) {
  const files = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(DIST_DIR, fullPath).replace(/\\/g, '/');
    
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      Object.assign(files, subFiles);
    } else if (entry.isFile()) {
      files[relativePath] = await uploadFile(fullPath, relativePath);
    }
  }
  return files;
}

async function main() {
  console.log('Reading dist files...');
  const files = await getAllFiles(DIST_DIR);
  console.log(`Found ${Object.keys(files).length} files`);

  // Get user's team ID
  console.log('Getting user info...');
  const userResp = await fetch('https://api.vercel.com/v2/user', {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });
  const userData = await userResp.json();
  const teamId = userData.user.defaultTeamId;
  console.log('Team ID:', teamId);

  // Create deployment
  console.log('Creating Vercel deployment...');
  const deployResp = await fetch(`https://api.vercel.com/v13/deployments?teamId=${teamId}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'cuz-events',
      files: Object.entries(files).map(([filePath, data]) => ({
        file: filePath,
        data: data.file,
        encoding: data.encoding
      })),
      projectSettings: {
        framework: null,
        devCommand: null,
        installCommand: null,
        buildCommand: null,
        outputDirectory: '.'
      },
      target: 'production'
    })
  });

  const result = await deployResp.json();
  
  if (deployResp.ok) {
    console.log('\n✅ Frontend deployed!');
    console.log('URL:', result.url ? `https://${result.url}` : 'Check Vercel dashboard');
    console.log('Preview URL:', result.alias ? `https://${result.alias[0]}` : 'N/A');
  } else {
    console.log('Deploy error:', JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
