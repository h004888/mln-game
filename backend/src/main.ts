import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export function getCorsConfig() {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : null;

  if (allowedOrigins && allowedOrigins.length > 0) {
    return {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy'), false);
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    };
  }

  // Chế độ phát triển / mặc định an toàn với credentials
  return {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };
}

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(getCorsConfig());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🎮 MLN-Game Backend running on port ${port}`);
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    console.error('Fatal error during application bootstrap:', err);
    process.exit(1);
  });
}
