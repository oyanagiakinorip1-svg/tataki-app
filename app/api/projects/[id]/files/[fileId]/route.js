// app/api/projects/[id]/files/[fileId]/route.js
import { prisma } from '@/lib/prisma'
import { deleteFromGoogleDrive } from '@/lib/googleDrive'

export async function DELETE(request, { params }) {
  try {
    const { fileId } = await params
    
    // まず、消そうとしているファイルの情報をDBから1回取ってくる（URLが欲しいから）
    const fileData = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (fileData) {
      // Google Driveから実体を完全に削除！
      await deleteFromGoogleDrive(fileData.url)
    }

    // 最後にSupabase（DB）からレコードを消す
    await prisma.file.delete({ 
      where: { id: fileId } 
    })
    
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("ファイル削除エラー:", error)
    return new Response("削除失敗", { status: 500 })
  }
}