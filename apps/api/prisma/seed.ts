import { PrismaClient, UserRole, VehicleType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@zipi.ar' },
    update: {},
    create: {
      name: 'Admin Zipi',
      email: 'admin@zipi.ar',
      phone: '+541100000000',
      password,
      role: UserRole.ADMIN,
    },
  });

  const passengerUser = await prisma.user.upsert({
    where: { email: 'juan@example.com' },
    update: {},
    create: {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '+541111111111',
      password,
      role: UserRole.PASSENGER,
    },
  });

  const driverCarUser = await prisma.user.upsert({
    where: { email: 'carlos@example.com' },
    update: {},
    create: {
      name: 'Carlos Rodríguez',
      email: 'carlos@example.com',
      phone: '+541122222222',
      password,
      role: UserRole.DRIVER,
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverCarUser.id },
    update: {},
    create: {
      userId: driverCarUser.id,
      vehicleType: VehicleType.CAR,
      vehiclePlate: 'AB123CD',
      vehicleModel: 'Toyota Corolla',
      vehicleYear: 2022,
      vehicleColor: 'Blanco',
      licenseNumber: 'LIC-001',
      isAvailable: true,
      isVerified: true,
      currentLat: -34.6037,
      currentLng: -58.3816,
      rating: 4.8,
      totalTrips: 150,
    },
  });

  const driverMotoUser = await prisma.user.upsert({
    where: { email: 'miguel@example.com' },
    update: {},
    create: {
      name: 'Miguel López',
      email: 'miguel@example.com',
      phone: '+541133333333',
      password,
      role: UserRole.DRIVER,
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverMotoUser.id },
    update: {},
    create: {
      userId: driverMotoUser.id,
      vehicleType: VehicleType.MOTORCYCLE,
      vehiclePlate: 'XY456ZW',
      vehicleModel: 'Honda CB 190',
      vehicleYear: 2023,
      vehicleColor: 'Rojo',
      licenseNumber: 'LIC-002',
      isAvailable: true,
      isVerified: true,
      currentLat: -34.6115,
      currentLng: -58.3722,
      rating: 4.9,
      totalTrips: 320,
    },
  });

  console.log('Seed completed:', { admin, passengerUser, driverCarUser, driverMotoUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
