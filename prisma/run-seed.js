// Seed runner for Prisma 7 with pg driver adapter
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });

const DATABASE_URL = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or POSTGRES_PRISMA_URL not set');
  process.exit(1);
}
console.log('✓ Database URL loaded');

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🎨 Seeding Paint & Keep database...');

  // ADMIN
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@paintandkeep.com' },
    update: {},
    create: {
      email: 'admin@paintandkeep.com',
      name: 'Super Admin',
      passwordHash: '$2b$12$LJ3VlPaYnHpFqOPK6TRdOOxJGFK76wLqmGW6z5NqGrXMCNx5Re4P2',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin created:', admin.email, '(password: admin123)');

  // CATEGORIES
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'animals' }, update: {}, create: { name: 'Animals', slug: 'animals' } }),
    prisma.category.upsert({ where: { slug: 'cartoon-characters' }, update: {}, create: { name: 'Cartoon Characters', slug: 'cartoon-characters' } }),
    prisma.category.upsert({ where: { slug: 'fantasy' }, update: {}, create: { name: 'Fantasy', slug: 'fantasy' } }),
    prisma.category.upsert({ where: { slug: 'festivals' }, update: {}, create: { name: 'Festivals', slug: 'festivals' } }),
    prisma.category.upsert({ where: { slug: 'birthday-special' }, update: {}, create: { name: 'Birthday Special', slug: 'birthday-special' } }),
    prisma.category.upsert({ where: { slug: 'family-packs' }, update: {}, create: { name: 'Family Packs', slug: 'family-packs' } }),
    prisma.category.upsert({ where: { slug: 'educational-kits' }, update: {}, create: { name: 'Educational Kits', slug: 'educational-kits' } }),
    prisma.category.upsert({ where: { slug: 'seasonal-collections' }, update: {}, create: { name: 'Seasonal Collections', slug: 'seasonal-collections' } }),
  ]);
  console.log(`✅ ${categories.length} categories created`);

  // PRODUCTS
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'rainbow-canvas-kit' },
      update: {},
      create: {
        slug: 'rainbow-canvas-kit',
        name: 'Rainbow Canvas Painting Kit',
        description: 'A colorful canvas painting kit perfect for young artists. Includes pre-sketched canvas, acrylic paints (12 colors), brushes, and a step-by-step guide.\n\nWhat\'s Included\n- Pre-sketched canvas (20x20cm)\n- 12 acrylic paint pots\n- 3 brushes (thin, medium, thick)\n- Step-by-step instruction card\n- Protective apron',
        price: 599,
        categoryId: categories[0].id,
        ageGroup: 'AGES_4_6',
        difficultyLevel: 'EASY',
        stock: 50,
        isPublished: true,
        isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'galaxy-night-sky-kit' },
      update: {},
      create: {
        slug: 'galaxy-night-sky-kit',
        name: 'Galaxy Night Sky Canvas Kit',
        description: 'Create a stunning galaxy painting with this kit. Includes black canvas, glow-in-the-dark paints, metallic colors, and splatter tools.\n\nWhat\'s Included\n- Black canvas (30x30cm)\n- 8 glow-in-the-dark paint tubes\n- 4 metallic paint tubes (gold, silver, copper, bronze)\n- Sponge set and splatter tools\n- Star stencils',
        price: 899,
        categoryId: categories[2].id,
        ageGroup: 'AGES_7_9',
        difficultyLevel: 'MEDIUM',
        stock: 35,
        isPublished: true,
        isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'unicorn-magic-kit' },
      update: {},
      create: {
        slug: 'unicorn-magic-kit',
        name: 'Unicorn Magic Painting Kit',
        description: 'Paint your own magical unicorn figurine! Includes a ceramic unicorn, iridescent paints, fine brushes, and glitter.\n\nWhat\'s Included\n- Ceramic unicorn figurine\n- 10 iridescent paint pots\n- 2 fine-tip brushes\n- Glitter tubes (3 colors)\n- Display stand',
        price: 749,
        categoryId: categories[2].id,
        ageGroup: 'AGES_4_6',
        difficultyLevel: 'EASY',
        stock: 40,
        isPublished: true,
        isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'diwali-diya-painting-set' },
      update: {},
      create: {
        slug: 'diwali-diya-painting-set',
        name: 'Diwali Diya Painting Set',
        description: 'Celebrate Diwali with handpainted diyas! Perfect family activity.\n\nWhat\'s Included\n- 6 clay diyas\n- 12 vibrant acrylic paints\n- Fine detail brushes\n- Decorative gems and sequins\n- Tea light candles',
        price: 499,
        categoryId: categories[3].id,
        ageGroup: 'FAMILY',
        difficultyLevel: 'EASY',
        stock: 60,
        isPublished: true,
        isFeatured: false,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'birthday-party-mini-canvas-pack' },
      update: {},
      create: {
        slug: 'birthday-party-mini-canvas-pack',
        name: 'Birthday Party Mini Canvas Pack (10 Kits)',
        description: 'Perfect return gifts for birthday parties! 10 individually packed mini canvas kits.\n\nWhat\'s Included\n- 10 mini canvases (15x15cm)\n- 10 sets of 6 paint pots each\n- 10 brushes\n- 10 individual carry bags\n- Party instruction card',
        price: 1999,
        categoryId: categories[4].id,
        ageGroup: 'AGES_4_6',
        difficultyLevel: 'EASY',
        stock: 25,
        isPublished: true,
        isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'ocean-world-canvas-kit' },
      update: {},
      create: {
        slug: 'ocean-world-canvas-kit',
        name: 'Ocean World Canvas Kit',
        description: 'Dive into the deep blue sea! Paint beautiful ocean creatures.\n\nWhat\'s Included\n- Pre-sketched ocean canvas (25x25cm)\n- 10 ocean-themed paint colors\n- 3 brushes\n- Sponge for wave effects\n- Reference card',
        price: 649,
        categoryId: categories[0].id,
        ageGroup: 'AGES_7_9',
        difficultyLevel: 'MEDIUM',
        stock: 30,
        isPublished: true,
        isFeatured: false,
      },
    }),
  ]);
  console.log(`✅ ${products.length} products created`);

  // PRODUCT IMAGES
  for (const product of products) {
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `/images/products/${product.slug}-1.jpg`,
        alt: `${product.name} - Main Image`,
        order: 0,
      },
    });
  }
  console.log('✅ Product images created');

  // COUPON
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 499,
      maxUsage: 1000,
      expiryDate: new Date('2027-12-31'),
      isActive: true,
    },
  });
  console.log('✅ Coupon WELCOME10 created');

  console.log('\n🎉 Seeding complete! Your shop now has products.');
  console.log('   Admin login: admin@paintandkeep.com');
}

main()
  .then(() => { pool.end(); return prisma.$disconnect(); })
  .catch((e) => {
    console.error('❌ Seed failed:', e.message || e);
    pool.end();
    prisma.$disconnect();
    process.exit(1);
  });
