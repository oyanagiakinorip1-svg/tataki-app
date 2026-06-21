// app/api/projects/route.js
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, // 公開してよいクライアント用キー
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()

  const projects = await prisma.project.findMany({
    where: {
      userId: user.id, // ここでユーザーに限定
    },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(projects)
}

export async function POST(request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, // 公開してよいクライアント用キー
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
 
  const body = await request.json()
  const project = await prisma.project.create({
    data: {
      title: body.title,
      userId: user.id, // ログインユーザーのID
    },
  })
  return Response.json(project, { status: 201 })
}