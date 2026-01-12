import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({
      adapter,
    });
  }
  async onModuleInit() {
    await this.$connect();
  }

  // Chạy khi module bị hủy (đóng kết nối DB để tránh rò rỉ tài nguyên)
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
