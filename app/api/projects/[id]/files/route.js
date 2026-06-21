// app/api/projects/[id]/files/route.js
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { uploadToGoogleDrive } from '@/lib/googleDrive'

export async function POST(request, { params }){ // 自作 (file情報, projectのid)
  try {
    const { id } = await params
    const formData = await request.formData()
    
    // フロントから送られてきたファイル本体を取得
    const file = formData.get('file') 
    if (!file) {
      return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
    }

    console.log("アップロードされたファイル情報:", file.name, file.type)

    const driveUrl = await uploadToGoogleDrive(file)
    
    // DBにはファイル名と、Google Drive上のURLを保存する
    const data = await prisma.file.create({
      data: { 
        name: file.name, 
        url: driveUrl, // Google Driveの保存先URL
        type: file.type,
        projectId: id 
      }
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'アップロード失敗' }, { status: 500 })
  }
}

export async function GET(request, {params}){
  const { id } = await params
  const files = await prisma.file.findMany({
    where: { projectId: id }
  })

  return NextResponse.json(files)
}