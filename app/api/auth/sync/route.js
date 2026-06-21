// app/api/auth/sync/route.js
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existingUser = await prisma.user.findUnique({
    where: { id: user.id }
  })

  if (existingUser) {
    return NextResponse.json(existingUser)
  }

  // DBにユーザーを書き込む
  const newUser = await prisma.user.create({
    data: {
      id: user.id,
      email: user.email,
      name: user.email.split('@')[0],
    },
  })

  return NextResponse.json(newUser)
}