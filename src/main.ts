import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function iniciarAplicacao() {
  const aplicacao = await NestFactory.create(AppModule);

  aplicacao.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const porta = process.env.PORT ?? 3000;
  await aplicacao.listen(porta);
}

void iniciarAplicacao();
