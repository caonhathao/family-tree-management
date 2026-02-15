import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'tsconfig-paths/register';

// console.log('--- TEST LOG ---'); // Đặt ở đây
// console.log('PORT:', process.env.PORT);
async function bootstrap() {
  // console.log('--- ALL ENV VARIABLES ---');
  // console.log(process.env);
  // console.log('-------------------------');
  const app = await NestFactory.create(AppModule);

  // const envConfigService = app.get(EnvConfigService);
  // console.log('--- EnvConfigService Loaded Variables ---');
  // console.log(envConfigService.allEnvVariables);

  //register module
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: process.env.CLIENT_DOMAIN, // URL Frontend trên Render
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
