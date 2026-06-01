import { PrismaClient, UserRole, VehicleType, TruckType, MachineryType } from '@prisma/client';
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

  // Conductor camión
  const driverTruckUser = await prisma.user.upsert({
    where: { email: 'roberto@example.com' },
    update: {},
    create: {
      name: 'Roberto Díaz',
      email: 'roberto@example.com',
      phone: '+541144444444',
      password,
      role: UserRole.DRIVER,
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverTruckUser.id },
    update: {},
    create: {
      userId: driverTruckUser.id,
      vehicleType: VehicleType.TRUCK,
      vehiclePlate: 'CT789AB',
      vehicleModel: 'Mercedes-Benz Atego 1726',
      vehicleYear: 2021,
      vehicleColor: 'Blanco',
      licenseNumber: 'LIC-003',
      truckType: TruckType.LARGE_TRUCK,
      capacityTons: 8,
      hasRefrigeration: false,
      isAvailable: true,
      isVerified: true,
      currentLat: -34.5987,
      currentLng: -58.4012,
      rating: 4.7,
      totalTrips: 80,
    },
  });

  // Conductor maquinaria
  const driverMachUser = await prisma.user.upsert({
    where: { email: 'fabian@example.com' },
    update: {},
    create: {
      name: 'Fabián Torres',
      email: 'fabian@example.com',
      phone: '+541155555555',
      password,
      role: UserRole.DRIVER,
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverMachUser.id },
    update: {},
    create: {
      userId: driverMachUser.id,
      vehicleType: VehicleType.HEAVY_MACHINERY,
      vehiclePlate: 'MQ321ZZ',
      vehicleModel: 'Caterpillar 320 GC',
      vehicleYear: 2020,
      vehicleColor: 'Amarillo',
      licenseNumber: 'LIC-004',
      machineryType: MachineryType.EXCAVATOR,
      isAvailable: true,
      isVerified: true,
      currentLat: -34.6200,
      currentLng: -58.3900,
      rating: 4.9,
      totalTrips: 45,
    },
  });

  console.log('Seed completed:', { admin, passengerUser, driverCarUser, driverMotoUser, driverTruckUser, driverMachUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
