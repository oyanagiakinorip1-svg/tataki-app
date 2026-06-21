// app/api/projects/[id]/datas/route.js
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request, { params }){ // 自作 (data情報, projectのid)
  const { id } = await params
  const { title, content } = await request.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'titleは必須です' }, { status: 400 })
  }

  const data = await prisma.data.create({
    data: { title: title.trim(), content: content, projectId: id }
  })

  return NextResponse.json(data, { status: 201 })
}

export async function GET(request, {params}){
  const { id } = await params
  const datas = await prisma.data.findMany({
    where: { projectId: id }
  })

  return NextResponse.json(datas)
}
