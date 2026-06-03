import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(helmet({
    strictTransportSecurity: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
  }));

  const corsOrigins = process.env.CORS_ORIGINS?.split(',');
  if (isProd && !corsOrigins) {
    throw new Error('CORS_ORIGINS env var is required in production');
  }
  app.enableCors({
    origin: corsOrigins ?? true,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Zipi API')
      .setDescription('API para el servicio de remisería y motomandado Zipi')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Zipi API running on port ${port}`);
  if (!isProd) console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
