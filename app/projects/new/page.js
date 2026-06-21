// app/projects/new/page.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
 
export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
 
  const handleSubmit = async (e) => {
    e.preventDefault()
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    router.push('/projects') // 登録後に一覧へ戻る
  }
 
  return (
    <main>
      <h1>プロジェクトを登録する</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button type="submit">登録する</button>
      </form>
      
      <button onClick={() => { // test
        router.push('/projects') // 一覧へ戻る
      }}>一覧へ戻る</button>
    </main>
  )
}