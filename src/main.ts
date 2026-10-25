import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 8000;
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  // Global Prefix: All endpoints are under /api/*
  app.setGlobalPrefix('api');

  // CORS Configuration
  const allowedOrigins = [
    'http://localhost:3000',
    'https://scholarbean.vercel.app',
  ];
  if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  });

  // Global Request Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );

  // Global Exception Handling Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ScholarBean API')
    .setDescription(
      'Comprehensive REST API for ScholarBean — Global scholarship discovery with an ASEAN focus.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Scholarships', 'Core scholarship discovery, filters, and details')
    .addTag('Platform Meta', 'Platform statistics, categories, and popular destinations')
    .addTag('Search', 'Live autocomplete search typeahead')
    .addTag('Admin & Moderation', 'Submissions review queue and scraper management')
    .addTag('Authentication', 'Admin authentication and JWT session issuance')
    .addTag('Health', 'Uptime and database health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'ScholarBean API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  await app.listen(port);

  logger.log(`🚀 ScholarBean Backend running on http://localhost:${port}/api`);
  logger.log(`📚 Swagger Documentation available at http://localhost:${port}/api/docs`);
  logger.log(`🩺 Health Check endpoint at http://localhost:${port}/api/health`);
}

bootstrap();
