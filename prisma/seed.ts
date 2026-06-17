import { PrismaClient, AdminRole, AgeGroup, DifficultyLevel, ModerationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎨 Seeding Paint & Keep database...');

  // ==================== ADMIN ====================
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@paintandkeep.com' },
    update: {},
    create: {
      email: 'admin@paintandkeep.com',
      name: 'Super Admin',
      passwordHash: '$2b$10$placeholder_hash_replace_in_production',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ==================== CATEGORIES ====================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'canvas-kits' },
      update: {},
      create: { name: 'Canvas Kits', slug: 'canvas-kits' },
    }),
    prisma.category.upsert({
      where: { slug: 'ceramic-painting' },
      update: {},
      create: { name: 'Ceramic Painting', slug: 'ceramic-painting' },
    }),
    prisma.category.upsert({
      where: { slug: 'diy-craft-kits' },
      update: {},
      create: { name: 'DIY Craft Kits', slug: 'diy-craft-kits' },
    }),
    prisma.category.upsert({
      where: { slug: 'return-gifts' },
      update: {},
      create: { name: 'Return Gifts', slug: 'return-gifts' },
    }),
    prisma.category.upsert({
      where: { slug: 'seasonal-specials' },
      update: {},
      create: { name: 'Seasonal Specials', slug: 'seasonal-specials' },
    }),
  ]);
  console.log(`✅ ${categories.length} categories created`);

  // ==================== PRODUCTS ====================
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'rainbow-canvas-kit' },
      update: {},
      create: {
        slug: 'rainbow-canvas-kit',
        name: 'Rainbow Canvas Painting Kit',
        description:
          'A colorful canvas painting kit perfect for young artists. Includes pre-sketched canvas, acrylic paints (12 colors), brushes, and a step-by-step guide.',
        price: 599,
        categoryId: categories[0].id,
        ageGroup: AgeGroup.AGES_4_6,
        difficultyLevel: DifficultyLevel.EASY,
        stock: 50,
        lowStockThreshold: 10,
        isPublished: true,
        isFeatured: true,
        seoTitle: 'Rainbow Canvas Kit for Kids | Paint & Keep',
        seoDescription: 'Perfect painting kit for beginners aged 4-6. Includes everything needed.',
      },
    }),
    prisma.product.upsert({
      where: { slug: 'galaxy-night-sky-kit' },
      update: {},
      create: {
        slug: 'galaxy-night-sky-kit',
        name: 'Galaxy Night Sky Canvas Kit',
        description:
          'Create a stunning galaxy painting with this kit. Includes black canvas, glow-in-the-dark paints, metallic colors, sponges, and splatter tools.',
        price: 899,
        categoryId: categories[0].id,
        ageGroup: AgeGroup.AGES_7_9,
        difficultyLevel: DifficultyLevel.MEDIUM,
        stock: 35,
        lowStockThreshold: 8,
        isPublished: true,
        isFeatured: true,
        seoTitle: 'Galaxy Night Sky Kit | Paint & Keep',
        seoDescription: 'Glow-in-the-dark galaxy painting kit for ages 7-9.',
      },
    }),
    prisma.product.upsert({
      where: { slug: 'ceramic-animal-set' },
      update: {},
      create: {
        slug: 'ceramic-animal-set',
        name: 'Ceramic Animal Painting Set',
        description:
          'Paint your own ceramic animals! Set includes 4 ceramic figurines (elephant, giraffe, lion, zebra), ceramic paints, fine brushes, and a display stand.',
        price: 1299,
        categoryId: categories[1].id,
        ageGroup: AgeGroup.AGES_10_12,
        difficultyLevel: DifficultyLevel.HARD,
        stock: 20,
        lowStockThreshold: 5,
        isPublished: true,
        isFeatured: false,
        seoTitle: 'Ceramic Animal Set | Paint & Keep',
        seoDescription: 'Premium ceramic painting set with 4 animal figurines.',
      },
    }),
    prisma.product.upsert({
      where: { slug: 'mini-canvas-return-gift-pack' },
      update: {},
      create: {
        slug: 'mini-canvas-return-gift-pack',
        name: 'Mini Canvas Return Gift Pack (Set of 10)',
        description:
          'Perfect return gifts for birthday parties! Pack of 10 mini canvas kits, each with a small canvas, 6 paint pots, and 2 brushes. Individually packed in gift boxes.',
        price: 1999,
        categoryId: categories[3].id,
        ageGroup: AgeGroup.AGES_4_6,
        difficultyLevel: DifficultyLevel.EASY,
        stock: 100,
        lowStockThreshold: 15,
        isPublished: true,
        isFeatured: true,
        seoTitle: 'Mini Canvas Return Gift Pack | Paint & Keep',
        seoDescription: 'Set of 10 mini canvas kits - perfect birthday party return gifts.',
      },
    }),
    prisma.product.upsert({
      where: { slug: 'mandala-art-kit' },
      update: {},
      create: {
        slug: 'mandala-art-kit',
        name: 'Mandala Art Kit for Teens & Adults',
        description:
          'Relaxing mandala art kit with dotting tools, acrylic paints, pre-printed guidelines on canvas, and meditation music QR code.',
        price: 749,
        categoryId: categories[2].id,
        ageGroup: AgeGroup.TEENS,
        difficultyLevel: DifficultyLevel.MEDIUM,
        stock: 40,
        lowStockThreshold: 10,
        isPublished: true,
        isFeatured: false,
        seoTitle: 'Mandala Art Kit | Paint & Keep',
        seoDescription: 'Therapeutic mandala painting kit for teens and adults.',
      },
    }),
  ]);
  console.log(`✅ ${products.length} products created`);

  // ==================== PRODUCT IMAGES ====================
  await Promise.all(
    products.map((product) =>
      prisma.productImage.create({
        data: {
          productId: product.id,
          url: `/images/products/${product.slug}-1.jpg`,
          alt: `${product.name} - Main Image`,
          order: 0,
        },
      })
    )
  );
  console.log(`✅ Product images created`);

  // ==================== SAMPLE USER ====================
  const user = await prisma.user.upsert({
    where: { email: 'demo@paintandkeep.com' },
    update: {},
    create: {
      email: 'demo@paintandkeep.com',
      name: 'Demo User',
      passwordHash: '$2b$10$placeholder_hash_replace_in_production',
      emailVerified: true,
      isActive: true,
      points: 150,
    },
  });
  console.log('✅ Demo user created:', user.email);

  // ==================== SAMPLE ADDRESS ====================
  await prisma.address.upsert({
    where: { id: 'seed-address-1' },
    update: {},
    create: {
      id: 'seed-address-1',
      userId: user.id,
      fullName: 'Demo User',
      phone: '9876543210',
      line1: '123 MG Road',
      line2: 'Apt 4B',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      isDefault: true,
    },
  });
  console.log('✅ Sample address created');

  // ==================== COUPONS ====================
  const coupons = await Promise.all([
    prisma.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: 499,
        maxUsage: 1000,
        currentUsage: 0,
        expiryDate: new Date('2025-12-31'),
        isActive: true,
      },
    }),
    prisma.coupon.upsert({
      where: { code: 'FLAT100' },
      update: {},
      create: {
        code: 'FLAT100',
        discountType: 'FIXED',
        discountValue: 100,
        minOrderAmount: 999,
        maxUsage: 500,
        currentUsage: 0,
        expiryDate: new Date('2025-12-31'),
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ ${coupons.length} coupons created`);

  // ==================== BADGES ====================
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { name: 'First Masterpiece' },
      update: {},
      create: {
        name: 'First Masterpiece',
        description: 'Submitted your first gallery photo',
        imageUrl: '/images/badges/first-masterpiece.png',
        criteria: JSON.stringify({ type: 'gallery_submissions', count: 1 }),
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Art Explorer' },
      update: {},
      create: {
        name: 'Art Explorer',
        description: 'Purchased 3 different kit types',
        imageUrl: '/images/badges/art-explorer.png',
        criteria: JSON.stringify({ type: 'unique_categories_purchased', count: 3 }),
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Super Painter' },
      update: {},
      create: {
        name: 'Super Painter',
        description: 'Completed 5 paint kits and shared in gallery',
        imageUrl: '/images/badges/super-painter.png',
        criteria: JSON.stringify({ type: 'gallery_submissions', count: 5 }),
      },
    }),
  ]);
  console.log(`✅ ${badges.length} badges created`);

  // ==================== CMS CONTENT ====================
  await Promise.all([
    prisma.cMSContent.upsert({
      where: { section: 'hero' },
      update: {},
      create: {
        section: 'hero',
        content: {
          headline: 'Unleash Your Inner Artist',
          subheadline: 'Premium paint kits for kids and families. Create, play, and keep!',
          ctaText: 'Shop Now',
          ctaLink: '/shop',
          backgroundImage: '/images/hero-bg.jpg',
        },
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.cMSContent.upsert({
      where: { section: 'about' },
      update: {},
      create: {
        section: 'about',
        content: {
          title: 'About Paint & Keep',
          description:
            'We believe every child is an artist. Paint & Keep provides curated painting kits that spark creativity and build confidence in young minds.',
          mission: 'Making art accessible and fun for every family in India.',
          story: 'Founded by a mom who wanted better creative experiences for her kids.',
        },
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.cMSContent.upsert({
      where: { section: 'faq' },
      update: {},
      create: {
        section: 'faq',
        content: {
          items: [
            {
              question: 'What age groups are the kits suitable for?',
              answer: 'We have kits for ages 4-6, 7-9, 10-12, teens, and family activities.',
            },
            {
              question: 'Do kits include all materials needed?',
              answer:
                'Yes! Every kit comes complete with paints, brushes, canvas/surface, and instructions.',
            },
            {
              question: 'What is your return policy?',
              answer: 'Unopened kits can be returned within 7 days. See our returns page for details.',
            },
          ],
        },
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
  ]);
  console.log('✅ CMS content created');

  // ==================== NEWSLETTER SUBSCRIBER ====================
  await prisma.newsletterSubscriber.upsert({
    where: { email: 'subscriber@example.com' },
    update: {},
    create: {
      name: 'Test Subscriber',
      email: 'subscriber@example.com',
      isActive: true,
    },
  });
  console.log('✅ Newsletter subscriber created');

  // ==================== CHALLENGE ====================
  await prisma.challenge.create({
    data: {
      title: 'Summer Splash Art Challenge',
      description:
        'Show us your best summer-themed painting! Use any Paint & Keep kit to create a masterpiece inspired by summer vibes - beaches, sunsets, ice cream, or anything that screams summer fun!',
      submissionStart: new Date('2025-06-01'),
      submissionEnd: new Date('2025-06-30'),
      votingStart: new Date('2025-07-01'),
      votingEnd: new Date('2025-07-07'),
      minEntries: 3,
      status: 'UPCOMING',
    },
  });
  console.log('✅ Sample challenge created');

  console.log('\n🎉 Seeding complete! Database is ready for development.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
