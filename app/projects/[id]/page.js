// app/projects/[id]/page.js

'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

import MarpViewer from '@/app/components/marpViewer'

export default function ProjectsIdPage({params}) {
    const { id } = use(params)
    const router = useRouter()

    const [datas, setDatas] = useState([])
    const [files, setFiles] = useState([])
    const [selectedFile, setSelectedFile] = useState(null) // 今選択されているファイル（デスクトップから選んだ未送信のファイル）を入れるステート
    const [project, setProject] = useState(null)

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const [request, setRequest] = useState('')

    const [explanation, setExplanation] = useState('')
    const [marp, setMarp] = useState('')

    const [addMode, setAddMode] = useState('DATA')
    const [isAiLoading, setIsAiLoading] = useState(false) // AI生成のローディング状態
    const [isExporting, setIsExporting] = useState(false) // エクスポートのローディング状態

    useEffect(() => {
        fetch(`/api/projects/${id}`)
        .then((res) => res.json())
        .then((data) => setProject(data))

        fetchDatas()
        fetchFiles()
    }, [id])

    const fetchDatas = () => {
        fetch(`/api/projects/${id}/datas`)
            .then((res) => res.json())
            .then((data) => setDatas(data))
    }

    const fetchFiles = () => {
        if (!id || typeof id !== 'string') return
        fetch(`/api/projects/${id}/files`)
            .then((res) => res.json())
            .then((data) => setFiles(data))
    }

    const handleDataSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) return

        const res = await fetch(`/api/projects/${id}/datas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
        })

        setTitle('')
        setContent('')

        if (res.ok)fetchDatas()
    }

    const handleFileSubmit = async (e) => {
        e.preventDefault()
        if (!selectedFile) return

        // JSONではなく、ファイル本体を包み込む「FormData」を作る
        const formData = new FormData()
        formData.append('file', selectedFile) // API側の formData.get('file') と名前を合わせる

        try {
            const res = await fetch(`/api/projects/${id}/files`, {
                method: 'POST',
                body: formData, // 衣服（HeadersのContent-Type）はブラウザが自動で設定するので、ここでは指定しないのが鉄則
            })

            if (res.ok) {
                setSelectedFile(null) // 選択をリセット
                fetchFiles() // ファイル一覧を再読み込み
                // ("ファイルをGoogle Driveにアップロードしました！")
            } else {
                alert("アップロードに失敗しました")
            }
        } catch (error) {
            console.error("ファイル送信エラー:", error)
            alert("通信エラーが発生しました")
        }
    }

    const handleDataDelete = async (dataId) => {
        await fetch(`/api/projects/${id}/datas/${dataId}`, { method: 'DELETE' })
        setDatas(datas.filter((b) => b.id !== dataId))
    }

    const handleFileDelete = async (fileId) => {
        await fetch(`/api/projects/${id}/files/${fileId}`, { method: 'DELETE' })
        setFiles(files.filter((b) => b.id !== fileId))
    }

    const handleRequestSubmit = async (e) => {
        e.preventDefault()
        if (!request.trim() || isAiLoading) return

        try {
            setIsAiLoading(true) // ローディング開始
            console.log("送信開始...", { request, datas, files })
            
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // エラーの原因になる files はここから完全に除外
                body: JSON.stringify({ request, datas, files }), 
            })

            if (!res.ok) {
                throw new Error(`HTTPエラー! ステータス: ${res.status}`)
            }

            const resultData = await res.json()
            console.log("APIから返ってきた生データ:", resultData)

            // データの存在チェックをしてから確実にステートにセット
            if (resultData) {
                setExplanation(resultData.explanation || "説明の取得に失敗しました(空データ)")
                setMarp(resultData.marpMarkdown || "スライドの取得に失敗しました(空データ)")
            }

        } catch (error) {
            console.error("リクエスト送信エラー:", error)
            alert("AIデータの取得に失敗しました。詳細はコンソールを確認してください。")
        } finally {
            setRequest('')
            setIsAiLoading(false) // ローディング終了
        }
    }

    const handleExport = async (format) => {
        // Geminiから返ってきたスライドデータ（Markdown文字列）
        const markdownText = marp; 
        
        if (!markdownText || isExporting) {
            alert("スライドデータがありません。先にAI生成を行ってください。")
            return
        }

        try {
            // パターンA：Markdown (.md) ファイルの場合（サーバーを叩かずフロントだけで即時保存）
            if (format === "md") {
                const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8;" })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `slide-${Date.now()}.md`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
                return
            }

            // 編集中のUIに「ローディング中...」などの状態を出すと親切です
            console.log(`${format.toUpperCase()} 変換を開始します...`)

            setIsExporting(true) // ローディング開始

            // パターンB：PDF / MD の場合（Marp CLIのAPIを叩く）
            const res = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markdown: markdownText, format: format }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.details || "エクスポートに失敗しました")
            }

            // レスポンスをBlobとして取得し、ブラウザでダウンロードを発火
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `slide-${Date.now()}.${format}`
            document.body.appendChild(a)
            a.click()
            
            // クリーンアップ
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            console.log(`${format.toUpperCase()} ダウンロードが成功しました！`)

        } catch (error) {
            console.error("エクスポートエラー:", error)
            alert(`出力に失敗しました: ${error.message}`)
        } finally {
            setIsExporting(false) // ローディング終了
        }
    }

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
        <header className="bg-gray-500 text-white p-4">
            <h1 className="text-lg">{project ? project.title : <p>データを読み込み中...</p>}</h1>
            <button onClick={() => {router.push('/')}} className="hover:bg-gray-600">プロジェクト一覧に戻る</button><br/>
        </header>

        <main className="w-full flex-1 min-h-0 bg-gray-50">
            <div className="flex w-full h-full">
                <div className="w-1/3 h-full border-r border-gray-200  bg-gray-300 flex flex-col justify-between">
                    <div className="flex flex-col flex-1 min-h-0">
                        <h2 className="text-sm font-bold mx-4 mt-4">データ一覧</h2>
                        <div className="flex-1 overflow-y-auto pr-1 mt-2 mx-4">
                            {datas.length === 0 && files.length === 0 && <p>まだデータが登録されていません。</p>}
                            {[...datas].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((data) => (
                                <div key={data.id} className="mb-4 p-2 border rounded bg-white">
                                    <h2>{data.title}</h2>
                                    <p>{data.content.length>15 ? `${data.content.slice(0, 15)}...` : data.content}</p>
                                    <button onClick={() => handleDataDelete(data.id)} className="hover:bg-gray-300">削除</button>
                                </div>
                            ))}
                            {[...files].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((data) => (
                                <div key={data.id} className="mb-4 p-2 border rounded bg-white">
                                    <h2>{data.name}</h2>
                                    <p>{data.type}</p>
                                    <button onClick={() => handleFileDelete(data.id)} className="hover:bg-gray-300">削除</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-3 bg-white">
                        <div className="bg-gray-300">
                            <button onClick={() => setAddMode('DATA')} className={`py-2 px-2 rounded-t-md text-sm font-bold ${addMode==='DATA' && 'bg-white'}`}>データを追加</button>
                            <button onClick={() => setAddMode('FILE')} className={`py-2 px-2 rounded-t-md text-sm font-bold ${addMode==='FILE' && 'bg-white'}`}>ファイルを追加</button>
                        </div>

                        <form onSubmit={handleDataSubmit} className={`flex flex-col gap-2 mt-2 ${addMode !== 'DATA' ? 'hidden' : ''}`}>
                            <input
                                placeholder="タイトル"
                                value={title || ''}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="mx-2 rounded-sm bg-gray-200"
                            />
                            <textarea
                                placeholder="文章"
                                value={content || ''}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows={3}
                                className="mx-2 rounded-sm bg-gray-200"
                            />
                            <button type="submit" className="mx-2 mb-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-800">登録する</button>
                        </form>
                        <form onSubmit={handleFileSubmit} className={`flex flex-col gap-2 mt-2 ${addMode !== 'FILE' ? 'hidden' : ''}`}>
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setSelectedFile(file); // ステートに選んだファイルを保存
                                }}
                            />
                            <label
                                htmlFor="file-upload"
                                className="mx-2 mb-2 inline-flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg cursor-pointer transition shadow-sm"
                            >
                                {/* クリップのアイコンとかを入れるとそれっぽい */}
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {selectedFile ? `選択中: ${selectedFile.name}` : "ファイルを選択"}
                            </label>
                            {selectedFile && (
                                <button type="submit" className="mx-2 mb-2 bg-green-500 text-white p-2 rounded">
                                    Google Driveにアップロード
                                </button>
                            )}
                        </form>
                        
                    </div>
                </div>

                <div className="w-2/3 h-full flex flex-col justify-between bg-gray-100">
                    <div className="w-full flex flex-1 min-h-0">
                        <div className="w-1/2 bg-white p-4 h-full overflow-y-auto border-r border-gray-200">
                            <h2 className="text-sm font-bold mb-2 text-gray-800">生成AIの説明</h2>
                            {isAiLoading ? (
                                <p className="text-gray-400">生成中...</p>
                            ) : (
                                <p className="whitespace-pre-wrap text-gray-600">{explanation}</p>
                            )}
                        </div>

                        <div className="w-1/2 bg-gray-800 flex flex-col h-full overflow-hidden">
                            <div className="text-white p-2 text-sm bg-gray-700 flex items-center justify-between shrink-0">
                                <span className="font-semibold">スライドプレビュー</span>
                                
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-gray-300 mr-1 hidden sm:inline">出力:</span>
                                    
                                    {/* PDF出力 */}
                                    <button
                                        onClick={() => handleExport("pdf")}
                                        disabled={!marp || isExporting || isAiLoading}
                                        className="px-2 py-0.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition shadow-sm active:scale-95"
                                        title="PDF形式で保存"
                                    >
                                        {isExporting ? "出力中..." : "PDF"}
                                    </button>

                                    {/* PPTX出力 */}
                                    <button
                                        onClick={() => handleExport("pptx")}
                                        disabled={!marp || isExporting || isAiLoading}
                                        className="px-2 py-0.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition shadow-sm active:scale-95"
                                        title="PowerPoint形式 (.pptx) で保存"
                                    >
                                        {isExporting ? "出力中..." : "PPTX"}
                                    </button>

                                    {/* MD出力 */}
                                    <button
                                        onClick={() => handleExport("md")}
                                        disabled={!marp || isAiLoading || isExporting}
                                        className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition shadow-sm active:scale-95"
                                        title="Markdown形式 (.md) で保存"
                                    >
                                        {isExporting ? "出力中..." : "MD"}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0">
                                {isAiLoading ? (
                                    <div className="p-4 text-gray-400 text-center">スライドを生成中...</div>
                                ) : marp ? (
                                    // テキスト表示の代わりにコンポーネントを呼び出し、markdownを渡す
                                    <MarpViewer markdown={marp} />
                                ) : (
                                    <div className="p-4 text-gray-400 text-center">
                                        AIにリクエストを送ると、ここにスライドが生成されます。
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-40 bg-gray-700">
                        <h2 className="text-white p-2 text-sm">入力</h2>
                        <form onSubmit={handleRequestSubmit} className="px-4">
                            <textarea
                            value={request}
                            onChange={(e) => setRequest(e.target.value)}
                            disabled={isAiLoading}
                            className="w-full bg-white h-20 rounded-sm text-lg"
                        />
                        <button 
                            type="submit" 
                            disabled={isAiLoading || !request.trim()}
                            className="text-sm bg-white px-2 disabled:bg-gray-400 disabled:opacity-60 disabled:text-gray-200 disabled:cursor-not-allowed"
                        >
                            {isAiLoading ? "送信中..." : "送信"}
                        </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
        </div>
    )
}