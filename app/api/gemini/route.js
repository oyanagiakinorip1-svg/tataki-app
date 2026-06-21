// app/api/gemini/route.js

import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { downloadFromGoogleDrive } from "@/lib/googleDrive"

// Geminiクライアントの初期化（環境変数 GEMINI_API_KEY が自動で読み込まれます）
const ai = new GoogleGenAI({})

export async function POST(request) {
  try {
    const req = await request.json()
    const text = req.request
    const datas = req.datas || []
    const files = req.files || []

    // データのテキスト情報をまとめる
    let dataTextContext = ""

    if (datas.length > 0) {
      dataTextContext += "\n\n【参考データ一覧】\n"
      for (const data of datas) {
        dataTextContext += `--- \nタイトル: ${data.title}\n内容: ${data.content}\n`
      }
    }

    // Geminiに渡すコンテンツの配列を準備
    const contents = [
      `以下の入力データとリクエストを元に、指定されたフォーマット（JSON）でデータを生成してください。

      【Marp出力の絶対ルール】
      1. スライドの先頭（1枚目の冒頭）には必ず以下のディレクティブを含めてください。これにより文字がはみ出さず自動で折り返されます。
      ---
      marp: true
      theme: default
      size: 16:9
      style: |
        section {
          word-break: break-all;
          font-size: 28px;
        }
        p, li {
          line-height: 1.5;
          margin-top: 0.2em;
          margin-bottom: 0.2em;
        }
          ul, ol {
          margin-top: 0.2em;
          margin-bottom: 0.2em;
        }
      ---
      2. 各スライド（--- で区切られたページ）内のテキスト量は以下の基準を厳守してください。
        - 【自然な文章表現】「〜です。〜ます。」といった自己紹介や説明文は、箇条書きにせず、通常のテキスト（段落）として最大3〜4行で簡潔に記述してください。主語と述語を不自然に箇条書きで分割してはいけません。
        - 【箇条書きの基準】複数の要素（メリット、特徴、手順など）を並列に並べる場合のみ、箇条書き（最大5行まで）を使用してください。
        - 1行あたりの文字数は「全角30文字まで」。それを超える場合は文脈の良いところで改行（<br>）を入れるか、次のスライドへ分割してください。
        - 1枚のスライドに情報を詰め込みすぎず、ページ数を増やして解決してください。
      3.【超重要・遅延対策】
        - 'mermaid' などの図表生成構文は絶対に使用しないでください。
        - データの推移や比較を出力したい場合は、必ず「標準のMarkdownテーブル（| 項目 | 値 |）」か「箇条書き」を使って表現してください。
        - テーブル（表）を出力する場合、縦は最大5行（ヘッダー含む）、横は最大3列までとしてください。それを超える複雑なデータは、複数のシンプルな表に分割するか、箇条書きに直してください。
      
        リクエスト: ${text}${dataTextContext}`
    ]

    // ファイル（PDF, 画像, テキストなど）の処理
    if (files.length > 0) {
      for (const file of files) {
        try {
          // DBに保存されている GASへの url が無ければスキップ
          if (!file.url) continue

          // GASの doGet からファイルの実体(Buffer)をダウンロード
          const { buffer } = await downloadFromGoogleDrive(file.url)

          // ファイルのMIMEタイプと名前は、DB（フロントから届いたデータ）の値を信頼して使用
          const mimeType = file.type || "application/octet-stream"
          const fileName = file.name || "file"

          // テキストファイル(.txt)の場合はプロンプトに直接文字として埋め込む
          if (mimeType.startsWith("text/") || fileName.endsWith(".txt")) {
            const textContent = buffer.toString("utf-8")
            contents.push(`\n\n【添付ファイル（${fileName}）の中身】:\n${textContent}`)
          } else {
            // 画像やPDF、その他のバイナリファイルはBase64でGeminiにマルチモーダルとして渡す
            contents.push({
              inlineData: {
                data: buffer.toString("base64"),
                mimeType: mimeType
              }
            })
          }
          console.log(`【AI送信成功】ファイル「${fileName}」を読み込みました`)
        } catch (fileError) {
          // 1つのファイルでエラーが起きても、他の処理を止めないようにキャッチ
          console.error(`ファイル(ID: ${file.id})の取得・解析に失敗したためスキップします:`, fileError)
        }
      }
    }

    // Gemini APIを呼び出す
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        // ここで構造化出力を強制する
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT", // 大文字で指定するのが新SDKの確実なルール
          properties: {
            marpMarkdown: {
              type: "STRING",
              description: "Marp形式のMarkdownテキスト。1ページにつき『箇条書きは5行まで』『1行30文字以内』を徹底し、はみ出す場合はスライドを次のページ(---)に分割すること。"
            },
            explanation: {
              type: "STRING",
              description: "返したスライドに関する説明。htmlに変換されるので相手はmarkdownかわからないからそこには触れずに説明して。"
            }
          },
          required: ["marpMarkdown", "explanation"]
        }, // 変換したJSON Schemaを渡す
        temperature: 0.1,
      }
    })

    // レスポンスのテキスト（JSON文字列）をパース
    const responseText = response.text
    if (!responseText) {
      throw new Error("Geminiからのレスポンスが空でした")
    }

    const resultData = JSON.parse(responseText)

    // フロント（React）に綺麗に成形されたJSONを返す
    return NextResponse.json(resultData)

  } catch (error) {
    console.error("Gemini Generation Error:", error)
    return NextResponse.json({ error: "内部サーバーエラーが発生しました" }, { status: 500 })
  }
}