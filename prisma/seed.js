/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ticko.local' },
    update: {},
    create: {
      email: 'admin@ticko.local',
      name: 'Admin User',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@ticko.local' },
    update: {},
    create: {
      email: 'organizer@ticko.local',
      name: 'Organizer One',
      password: passwordHash,
      role: Role.ORGANIZER,
    },
  });

  const attendee = await prisma.user.upsert({
    where: { email: 'attendee@ticko.local' },
    update: {},
    create: {
      email: 'attendee@ticko.local',
      name: 'Attendee One',
      password: passwordHash,
      role: Role.ATTENDEE,
    },
  });

  const venue = await prisma.venue.create({
    data: {
      name: 'Main Conference Hall',
      address: '123 Main St',
      city: 'Sample City',
      country: 'Sample Country',
      capacity: 1000,
    },
  });

  const event = await prisma.event.create({
    data: {
      name: 'Tech Conference 2026',
      description: 'A sample seeded tech conference event.',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      totalCapacity: 500,
      isPublished: true,
      organizerId: organizer.id,
      venueId: venue.id,
      ticketTypes: {
        create: [
          {
            name: 'Early Bird',
            description: 'Discounted early tickets',
            price: 49.99,
            capacity: 100,
          },
          {
            name: 'Regular',
            description: 'Standard tickets',
            price: 79.99,
            capacity: 300,
          },
          {
            name: 'VIP',
            description: 'VIP experience tickets',
            price: 149.99,
            capacity: 100,
          },
        ],
      },
    },
    include: { ticketTypes: true },
  });

  // Pre-generate ticket inventory for each ticket type
  for (const type of event.ticketTypes) {
    const ticketsData = Array.from({ length: type.capacity }).map((_, idx) => ({
      uniqueCode: `${event.id}-${type.id}-${idx + 1}`,
      status: 'AVAILABLE',
      ticketTypeId: type.id,
    }));
    const chunkSize = 100;
    // chunked createMany to avoid large payloads
    for (let i = 0; i < ticketsData.length; i += chunkSize) {
      const chunk = ticketsData.slice(i, i + chunkSize);
      // eslint-disable-next-line no-await-in-loop
      await prisma.ticket.createMany({ data: chunk });
    }
  }

  // eslint-disable-next-line no-console
  console.log('Seeded users, venue, event, ticket types, and tickets.', {
    admin: admin.email,
    organizer: organizer.email,
    attendee: attendee.email,
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

