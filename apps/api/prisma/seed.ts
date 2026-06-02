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

  // Service categories
  const serviceCategories = [
    { name: 'Electricista',   icon: '⚡', description: 'Instalaciones y reparaciones eléctricas' },
    { name: 'Plomero',        icon: '🔧', description: 'Cañerías, desagotes y sanitarios' },
    { name: 'Gasista',        icon: '🔥', description: 'Instalaciones y reparaciones de gas' },
    { name: 'Pintor',         icon: '🎨', description: 'Pintura interior y exterior' },
    { name: 'Carpintero',     icon: '🪚', description: 'Muebles, puertas y reparaciones' },
    { name: 'Cerrajero',      icon: '🔑', description: 'Apertura, cerraduras e instalaciones' },
    { name: 'Albañil',        icon: '🧱', description: 'Reformas, reparaciones y construcción' },
    { name: 'Limpieza',       icon: '🧹', description: 'Limpieza del hogar y mudanzas' },
  ];

  for (const cat of serviceCategories) {
    await prisma.serviceCategory.upsert({
      where: { name: cat.name } as any,
      update: {},
      create: cat,
    });
  }

  // Contractor user
  const contractorUser = await prisma.user.upsert({
    where: { email: 'electricista@example.com' },
    update: {},
    create: {
      name: 'Pedro Gómez',
      email: 'electricista@example.com',
      phone: '+541166666666',
      password,
      role: UserRole.CONTRACTOR,
    },
  });

  const electricCategory = await prisma.serviceCategory.findFirst({ where: { name: 'Electricista' } });
  if (electricCategory) {
    const contractorProfile = await prisma.contractorProfile.upsert({
      where: { userId: contractorUser.id },
      update: {},
      create: {
        userId: contractorUser.id,
        bio: 'Electricista matriculado con 10 años de experiencia. Instalaciones domiciliarias, tableros y emergencias.',
        cuit: '20-30000000-0',
        isVerified: true,
        isAvailable: true,
        rating: 4.9,
        totalJobs: 87,
        coverageKm: 30,
      },
    });

    await prisma.contractorService.upsert({
      where: { contractorId_categoryId: { contractorId: contractorProfile.id, categoryId: electricCategory.id } },
      update: {},
      create: { contractorId: contractorProfile.id, categoryId: electricCategory.id },
    });
  }

  console.log('Seed completed: users, drivers, service categories + contractor');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
