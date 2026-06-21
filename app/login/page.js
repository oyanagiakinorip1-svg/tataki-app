// app/login/page.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
 
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
 
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
 
    if (error) {
      setError('メールアドレスまたはパスワードが間違っています')
    } else {
      router.push('/')
      
      // データベース初期化時にuserと紐づけるための仮処理。
      await fetch('/api/auth/sync', {method: 'POST' })
    }
  }
 
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-9xl p-4">TATAKI</h1><br/>
      <div className="text-lg">
        <h2>ログインページ</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '8px' , backgroundColor: '#e4e4e4' }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '16px' ,backgroundColor: '#e4e4e4' }}
        />
        <button onClick={handleLogin} style={{ width: '100%', padding: '8px' }} className="hover:bg-gray-300">
          ログイン
        </button>
        <button onClick={() => {router.push('/signup')}} style={{ width: '100%', padding: '8px' }} className="hover:bg-gray-300">
          新規登録
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  )
}