// prisma.config.ts
import 'dotenv/config' // .env を読み込む
import { defineConfig, env } from 'prisma/config'
 
export default defineConfig({
  schema: 'prisma/schema.prisma', // Prismaスキーマの場所
  datasource: {
    url: env('DATABASE_URL'), // CLIが使うDB接続文字列
  },
})