// lib/prisma.js
import { PrismaClient } from '../generated/prisma/client.ts' // ESM では拡張子 .js まで書く
import { PrismaPg } from '@prisma/adapter-pg'
 
// 開発環境での重複インスタンス防止
const globalForPrisma = globalThis
 
// PostgreSQL用のアダプターを作る（Prisma 7 では adapter が必須）
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
 
// ?? は「左が null / undefined のときだけ右を使う」演算子
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
 
// NODE_ENV は実行環境を表す環境変数（development / production など）
// 開発時だけ global に保持して、ホットリロード時の多重接続を防ぐ
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}