// app/components/marpViewer.js

'use client'
import { useEffect, useRef } from 'react'
import { Marp } from '@marp-team/marp-core'

export default function MarpViewer({ markdown }) {
    const containerRef = useRef(null)

    useEffect(() => {
        if (!containerRef.current || !markdown) return

        try {
            // 1. Marp のインスタンス化とレンダリング
            const marp = new Marp()
            const { html, css } = marp.render(markdown)

            // 2. Shadow DOM の作成（既存のシャドウがあれば再利用）
            let shadow = containerRef.current.shadowRoot
            if (!shadow) {
                shadow = containerRef.current.attachShadow({ mode: 'open' })
            }

            // 3. Shadow DOM 内に CSS と HTML を注入
            // これにより、Tailwind CSS の影響を完全にシャットアウトします
            shadow.innerHTML = `
                <style>
                    ${css}
                    /* 必要に応じて、スライドの親要素のサイズをコンテナに合わせる調整 */
                    .marp-wrapper {
                        width: 100%;
                        height: 100%;
                        overflow-y: auto;
                    }
                </style>
                <div class="marp-wrapper">
                    ${html}
                </div>
            `
        } catch (error) {
            console.error("Marpのパースエラー:", error)
        }
    }, [markdown])

    // 外側の表示領域。Tailwindでスクロールや背景、高さを制御
    return (
        <div 
            ref={containerRef} 
            className="w-full h-full overflow-y-auto bg-gray-900" 
        />
    )
}