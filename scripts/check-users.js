const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const db = new PrismaClient();

function hashNode(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  const users = await db.user.findMany();
  console.log('All users in DB:', users.map(u => ({ email: u.email, role: u.role, hash: u.password })));
  
  const testInput = 'Prime2025';
  console.log('Node hash for Prime2025:', hashNode(testInput));
  
  // also check exactly what the /api/init created
}

main().catch(console.error).finally(() => db.$disconnect());
