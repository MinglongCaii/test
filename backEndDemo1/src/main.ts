import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './utils/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe()); //happens before controller to validate
  app.useGlobalInterceptors(new TransformInterceptor()); // happens after controller to set what to deliver -> modified output

  app.enableCors({ //CORS to let FE connects to BE
  origin: 'http://localhost:3000',
  credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
