// app/api/projects/[id]/datas/[dataId]/route.js
import { prisma } from '@/lib/prisma'

export async function DELETE(request, { params }) {
  const { dataId } = await params
  await prisma.data.delete({ where: { id: dataId } })
  return new Response(null, { status: 204 })
}