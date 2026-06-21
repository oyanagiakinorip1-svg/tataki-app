// app/projects/[id]/datas/new/page.js
'use client'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
 
export default function NewDataPage({params}) {
  const { id } = use(params)
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
 
  const handleSubmit = async (e) => {
    e.preventDefault()
    await fetch(`/api/projects/${id}/datas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    router.push(`/projects/${id}`) // 登録後にプロジェクトへ戻る
  }
 
  return (
    <main>
      <h1>データを登録する</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        /><br/>
        <textarea
          placeholder="文章"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        /><br/>
        <button type="submit">登録する</button>
      </form>
      
      <button onClick={() => { // test
        router.push(`/projects/${id}`) // プロジェクトへ戻る
      }}>プロジェクトへ戻る</button>
    </main>
  )
}