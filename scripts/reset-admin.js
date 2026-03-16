const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Prime2025', 12);
  
  const user = await db.user.update({
    where: { email: 'gabriel@eventosprime.com' },
    data: { 
      password: hash,
      role: 'admin',
      plan: 'AGENCY'
    }
  });
  
  console.log('Password reset and plan upgraded for:', user.email, '| role:', user.role, '| plan:', user.plan);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
