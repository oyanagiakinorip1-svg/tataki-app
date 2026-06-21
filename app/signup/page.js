// app/signup/page.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
 
export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const router = useRouter()
 
  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
 
    if (error) {
      // setMessage(`エラー: ${error.message}`)
      setMessage('無効な入力です')
    } else {
      await fetch('/api/auth/sync', { method: 'POST' }) // 仮置きになるかも? authに対応したusersを作成
      setMessage('登録しました。ログインページからログインしてください。')
    }
  }
 
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-9xl p-4">TATAKI</h1><br/>
      <div className="text-lg">
        <h1>新規登録</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '8px' }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード（6文字以上）"
          style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '16px' }}
        />
        <button onClick={handleSignup} style={{ width: '100%', padding: '8px' }} className='hover:bg-gray-300'>
          登録する
        </button>
        <button onClick={() => {{router.push('/login')}}} style={{ width: '100%', padding: '8px' }} className='hover:bg-gray-300'>
          ログインページへ
        </button>
        {message && <p style={{ marginTop: '16px' }} className="text-red-500">{message}</p>}
      </div>
    </div>
      
  )
}