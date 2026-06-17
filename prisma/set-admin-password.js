// Sets the admin password to Admin@123
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('Admin@123', 12);
  
  await prisma.admin.update({
    where: { email: 'admin@paintandkeep.com' },
    data: { passwordHash: hash },
  });

  console.log('✅ Admin password set to: Admin@123');
  console.log('   Email: admin@paintandkeep.com');
  console.log('   Login at: http://localhost:3000/admin/login');
}

main()
  .then(() => { pool.end(); prisma.$disconnect(); })
  .catch((e) => { console.error('❌ Failed:', e.message); pool.end(); process.exit(1); });
