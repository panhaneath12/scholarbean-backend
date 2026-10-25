import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MOCK_SCHOLARSHIPS } from '../src/common/data/mock-scholarships.data';
import { DEFAULT_CATEGORIES } from '../src/common/constants/asean.constants';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Categories
  console.log('Seeding categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon },
      create: {
        name: cat.name,
        icon: cat.icon,
        count: 0,
      },
    });
  }

  // 2. Seed Admin User
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@scholarbean.com';
  const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminScholarBean2026!';
  const hashedPassword = await bcrypt.hash(adminPass, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { password_hash: hashedPassword },
    create: {
      email: adminEmail,
      password_hash: hashedPassword,
      name: 'ScholarBean Admin',
      role: 'ADMIN',
    },
  });
  console.log(` Created admin user: ${adminEmail}`);

  // 3. Seed Scholarships
  console.log(`Seeding ${MOCK_SCHOLARSHIPS.length} initial scholarships...`);
  for (const item of MOCK_SCHOLARSHIPS) {
    await prisma.scholarship.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        provider: item.provider,
        country: item.country,
        flag: item.flag,
        level: item.level,
        field: item.field,
        funding: item.funding,
        amount: item.amount,
        duration: item.duration,
        deadline: new Date(item.deadline),
        start_date: item.start_date,
        eligible_nationalities: item.eligible_nationalities,
        eligible_countries: item.eligible_countries,
        is_asean_friendly: item.is_asean_friendly,
        thumbnail: item.thumbnail,
        logo: item.logo,
        short_description: item.short_description,
        description: item.description,
        benefits: item.benefits,
        requirements: item.requirements,
        documents_required: item.documents_required,
        how_to_apply: item.how_to_apply,
        official_link: item.official_link,
        source_url: item.source_url,
        tags: item.tags,
        is_featured: item.is_featured,
        view_count: item.view_count,
        status: item.status,
      },
      create: {
        id: item.id,
        slug: item.slug,
        name: item.name,
        provider: item.provider,
        country: item.country,
        flag: item.flag,
        level: item.level,
        field: item.field,
        funding: item.funding,
        amount: item.amount,
        duration: item.duration,
        deadline: new Date(item.deadline),
        start_date: item.start_date,
        eligible_nationalities: item.eligible_nationalities,
        eligible_countries: item.eligible_countries,
        is_asean_friendly: item.is_asean_friendly,
        thumbnail: item.thumbnail,
        logo: item.logo,
        short_description: item.short_description,
        description: item.description,
        benefits: item.benefits,
        requirements: item.requirements,
        documents_required: item.documents_required,
        how_to_apply: item.how_to_apply,
        official_link: item.official_link,
        source_url: item.source_url,
        tags: item.tags,
        is_featured: item.is_featured,
        view_count: item.view_count,
        status: item.status,
      },
    });
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
