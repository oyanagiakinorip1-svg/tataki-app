// app/api/export/route.js

import { NextResponse } from "next/server"
import { exec } from "child_process"
import util from "util"
import fs from "fs/promises"
import path from "path"

const execPromise = util.promisify(exec)

export async function POST(request) {
  try {
    const { markdown, format } = await request.json()
    
    if (!markdown) {
      return NextResponse.json({ error: "Markdownが空です" }, { status: 400 })
    }
    if (format !== "pdf" && format !== "pptx") {
      return NextResponse.json({ error: "無効なフォーマットです" }, { status: 400 })
    }

    // 💡 サーバー上の temporary フォルダのパスを設定
    const tmpDir = path.join(process.cwd(), "tmp")
    await fs.mkdir(tmpDir, { recursive: true })
    
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const inputPath = path.join(tmpDir, `slide-${uniqueId}.md`)
    const outputPath = path.join(tmpDir, `slide-${uniqueId}.${format}`)

    // 1. 一時的にMarkdownファイルとしてサーバーへ保存
    await fs.writeFile(inputPath, markdown, "utf-8")

    // 2. Marp CLIのコマンドを実行してファイルに変換
    // ⚠️ ローカルのChrome（Puppeteer）が動くため、数秒かかります
    await execPromise(
        `npx @marp-team/marp-cli --no-stdin "${inputPath}" -o "${outputPath}"`
    )

    // 3. 生成されたファイルのバイナリデータを読み込む
    const fileBuffer = await fs.readFile(outputPath)

    // 4. 用済みのファイルを綺麗に削除（ストレージ圧迫防止）
    await fs.unlink(inputPath)
    await fs.unlink(outputPath)

    // 5. 適切なMIMEタイプを設定してバイナリを返却
    const contentType = format === "pdf" 
      ? "application/pdf" 
      : "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="slide.${format}"`,
      },
    })

  } catch (error) {
    console.error("🔥 [Marp Export Error]:", error)
    return NextResponse.json({ error: "スライドの生成に失敗しました", details: error.message }, { status: 500 })
  }
}