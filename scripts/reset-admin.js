const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const db = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  const hash = hashPassword('Prime2025');
  
  // 1. Copy Logo from Legal docs
  const sourceLogo = path.join('C:', 'Users', 'hp', 'OneDrive', 'Documentos', 'Eventos Prime', '00- ANTIGRAVITY', 'Legal docs empresa', 'favicon-eventos-prime-logo-2026-final.png');
  const destDir = path.join(__dirname, '..', 'public', 'uploads');
  const destLogoName = 'favicon-eventos-prime-logo-2026-final.png';
  const destLogo = path.join(destDir, destLogoName);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  if (fs.existsSync(sourceLogo)) {
    fs.copyFileSync(sourceLogo, destLogo);
    console.log('Logo corporativo copiado exitosamente a /uploads.');
  } else {
    console.warn('Cuidado: No se encontró el archivo de logo original en:', sourceLogo);
  }

  // 2. Upsert Admin User (Plan CREADOR_ANGEL)
  const user = await db.user.upsert({
    where: { email: 'ventas@eventosprimeai.com' },
    update: { 
      password: hash,
      role: 'admin',
      plan: 'CREADOR_ANGEL'
    },
    create: {
      email: 'ventas@eventosprimeai.com',
      name: 'Ventas Eventos Prime',
      password: hash,
      role: 'admin',
      plan: 'CREADOR_ANGEL'
    }
  });

  // 3. Upsert Business Profile
  const profile = await db.businessProfile.upsert({
    where: { userId: user.id },
    update: {
      companyName: 'Eventos Prime C.A.',
      taxId: '0993401502001856', 
      logoUrl: '/uploads/' + destLogoName,
      email: 'ventas@eventosprimeai.com',
      website: 'https://eventosprimeai.com'
    },
    create: {
      userId: user.id,
      companyName: 'Eventos Prime C.A.',
      taxId: '0993401502001856',
      logoUrl: '/uploads/' + destLogoName,
      email: 'ventas@eventosprimeai.com',
      website: 'https://eventosprimeai.com'
    }
  });
  
  console.log('Password reset y perfil configurado para:', user.email);
  console.log('Role:', user.role, '| Plan:', user.plan);
  console.log('Empresa:', profile.companyName, '| RUC:', profile.taxId);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
