const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  const hash = hashPassword('Prime2025');
  
  const user = await db.user.upsert({
    where: { email: 'gabriel@eventosprime.com' },
    update: { 
      password: hash,
      role: 'admin',
      plan: 'AGENCY'
    },
    create: {
      email: 'gabriel@eventosprime.com',
      name: 'Gabriel (Admin)',
      password: hash,
      role: 'admin',
      plan: 'AGENCY'
    }
  });
  
  console.log('Password reset OK for:', user.email, '| role:', user.role, '| plan:', user.plan);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
