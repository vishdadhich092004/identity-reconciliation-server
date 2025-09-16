import { PrismaClient, LinkPrecedence } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  try {
    // Clear existing contacts to avoid duplicates
    console.log('Clearing existing contacts...');
    await prisma.contact.deleteMany({});
    console.log('Existing contacts cleared');

    // Create primary contact: Lorraine Hill
    console.log('Creating primary contact: Lorraine Hill...');
    const lorraine = await prisma.contact.create({
      data: {
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456',
        linkPrecedence: LinkPrecedence.primary,
      },
    });
    console.log(`Created primary contact: ${lorraine.email} (ID: ${lorraine.id})`);

    // Create secondary contact linked to Lorraine: McFly
    console.log('Creating secondary contact: McFly...');
    const mcfly = await prisma.contact.create({
      data: {
        email: 'mcfly@hillvalley.edu',
        phoneNumber: '123456',
        linkedId: lorraine.id,
        linkPrecedence: LinkPrecedence.secondary,
      },
    });
    console.log(`Created secondary contact: ${mcfly.email} (ID: ${mcfly.id}) linked to ${lorraine.email}`);

    // Create another primary contact: George McFly
    console.log('Creating primary contact: George McFly...');
    const george = await prisma.contact.create({
      data: {
        email: 'george@hillvalley.edu',
        phoneNumber: '919191',
        linkPrecedence: LinkPrecedence.primary,
      },
    });
    console.log(`Created primary contact: ${george.email} (ID: ${george.id})`);

    // Create another primary contact: Biff
    console.log('Creating primary contact: Biff...');
    const biff = await prisma.contact.create({
      data: {
        email: 'biffsucks@hillvalley.edu',
        phoneNumber: '717171',
        linkPrecedence: LinkPrecedence.primary,
      },
    });
    console.log(`Created primary contact: ${biff.email} (ID: ${biff.id})`);

    // Display summary
    console.log('\nSeeding Summary:');
    console.log('==================');
    const allContacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'asc' },
    });

    allContacts.forEach((contact, index) => {
      const linkInfo = contact.linkPrecedence === LinkPrecedence.secondary 
        ? `(linked to ID: ${contact.linkedId})` 
        : '(primary)';
      console.log(`${index + 1}. ${contact.email} | ${contact.phoneNumber} | ${contact.linkPrecedence} ${linkInfo}`);
    });

    console.log(`\nSuccessfully seeded ${allContacts.length} contacts!`);
    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting from database...');
    await prisma.$disconnect();
    console.log('Database connection closed');
  });
