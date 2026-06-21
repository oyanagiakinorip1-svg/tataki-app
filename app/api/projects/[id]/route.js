// app/api/projects/[id]/route.js
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
 
export async function GET(request, {params}){
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id: id }
  })
  return NextResponse.json(project)
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // 道連れで消えてしまう前に、このプロジェクトに紐づくファイルを全部リストアップする
    const relatedFiles = await prisma.file.findMany({
      where: { projectId: id }
    })

    // リストアップしたファイルを、Google Driveから1件ずつ全部お掃除する
    for (const file of relatedFiles) {
      await deleteFromGoogleDrive(file.url)
    }

    // Google Driveが綺麗になったら、満を持してプロジェクトを削除！
    // (SupabaseのCascadeのおかげで、ここのDataやFileのレコードは自動で連動して消えます)
    await prisma.project.delete({ 
      where: { id: id } 
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("プロジェクト削除エラー:", error)
    return new Response("削除失敗", { status: 500 })
  }
}