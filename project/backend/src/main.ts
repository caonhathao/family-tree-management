import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'tsconfig-paths/register';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //register module
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors();

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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
