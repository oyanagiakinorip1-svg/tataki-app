// app/projects/page.js
'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
    const router = useRouter()
    const [projects, setProjects] = useState([])
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(true)

    // dialog要素を直接操作するための参照（Ref）
    const dialogRef = useRef(null)

    // データを取得する処理を関数化して、登録後にも再利用できるようにする
    const fetchProjects = () => {
        
        setLoading(true)

        fetch('/api/projects')
            .then((res) => res.json())
            .then((data) => {
                setProjects(data)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    // モーダルを開く処理
    const openModal = () => {
        dialogRef.current?.showModal() // ブラウザ標準の最前面レイヤーで開く
    }

    // モーダルを閉じる処理
    const closeModal = () => {
        dialogRef.current?.close()
        setTitle('') // 入力値をリセット
    }

    // new/page.js から移植・統合した登録処理
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) return

        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        })

        if (res.ok) {
            closeModal()
            fetchProjects()
        }
    }

    const handleDelete = async (id) => {
        await fetch(`/api/projects/${id}`, { method: 'DELETE' })
        setProjects(projects.filter((b) => b.id !== id))
    }

    return (
        <>
        <header className="bg-gray-500 text-white p-4">
            <h1>プロジェクト一覧</h1>
            <button onClick={openModal}>プロジェクトを追加</button>
        </header>

        <main className="w-full py-10">
            {loading && <p className="flex justify-center text-xl">読み込み中...</p>}
            {!loading && projects.length === 0 && <p className="flex justify-center text-xl">まだプロジェクトが登録されていません。</p>}
            <div className="flex flex-wrap gap-8 pt-4 px-4 w-full max-w-6xl mx-auto">

                {[...projects]
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((project) => (
                        <div
                            key={project.id}
                            className="relative size-60 bg-gray-100 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-center items-center group hover:bg-gray-200 transition"
                        >
                            <button
                                onClick={() => {router.push(`/projects/${project.id}`)}}
                                className="size-60 bg-gray-350 border border-gray-200 rounded-xl shadow-sm p-4 text-xl"
                            >
                                {project.title}
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // カード全体のクリックイベントが連動して発動するのを防ぐ
                                    handleDelete(project.id);
                                }} 
                                className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500 bg-white/80 hover:bg-white rounded-full p-1 shadow-sm transition"
                                title="削除"
                            >
                                <svg 
                                    className="size-5" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth="2.5" 
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))
                }

            </div>
        </main>

        <dialog 
            ref={dialogRef}
            className="fixed inset-0 m-auto rounded-xl shadow-xl p-0 backdrop:bg-black/50 w-full max-w-md overflow-hidden"
        >
            <div className="bg-gray-800 text-white p-6">
                <h2 className="text-xl font-bold mb-4">新しいプロジェクトを追加</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm mb-1">プロジェクト名</label>
                        <input
                            placeholder="プロジェクトのタイトルを入力..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-2">
                        <button 
                            type="button" 
                            onClick={closeModal}
                            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
                        >
                            キャンセル
                        </button>
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-semibold transition"
                        >
                            作成する
                        </button>
                    </div>
                </form>
            </div>
        </dialog>
        </>
        
    )
}