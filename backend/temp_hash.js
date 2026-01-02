const bcrypt = require('bcryptjs');

async function generateHashes() {
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const demoPass = await bcrypt.hash('Demo@123', 10);
  const userPass = await bcrypt.hash('User@123', 10);
  
  console.log('Admin:', adminPass);
  console.log('Demo:', demoPass);
  console.log('User:', userPass);
}

generateHashes();
