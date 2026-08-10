import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import 'tsconfig-paths/register';

process.env.TZ = 'Asia/Ho_Chi_Minh';

// console.log('--- TEST LOG ---'); // Đặt ở đây
// console.log('PORT:', process.env.PORT);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const envConfigService = app.get(EnvConfigService);
  // console.log('--- EnvConfigService Loaded Variables ---');
  // console.log(envConfigService.allEnvVariables);

  //register module
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const corsOrigins = (
    process.env.CORS_ORIGINS ||
    process.env.CLIENT_DOMAIN ||
    ''
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  //setup swagger
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
