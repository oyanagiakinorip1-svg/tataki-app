# アプリケーションの実行方法

このアプリケーションをローカル環境で構築し、実行するための手順です。

## 1. 前提条件の準備

事前に以下の環境やアカウントを用意し、設定を行ってください。

* **Supabase**
  * プロジェクトを作成し、URLとパブリッシャブルキーを取得します。
* **Gemini API**
  * APIキーを取得します。
* **Google Drive & GAS**
  1. Google Driveにデータ保存用のフォルダを作成し、そのフォルダのURLから**フォルダID**（`folders/` 以降の文字列）をメモします。
  2. Google Apps Script（GAS）プロジェクトを作成し、本リポジトリの `gas` フォルダ内にある `code.js` の内容を貼り付けます。
  3. コード内の `"YOUR_FOLDER_ID"` を、先ほどメモしたフォルダIDに書き換えてデプロイ（ウェブアプリとして公開）し、**GASのURL**を取得します。

## 2. リポジトリのクローンと依存関係のインストール

ターミナルを開き、以下のコマンドを順番に実行します。

```bash
# リポジトリのクローン
git clone <リポジトリのURL>

# プロジェクトディレクトリへの移動
cd <リポジトリ名>

# 依存関係（パッケージ）のインストール
npm install
```

## 3. 環境変数の設定
プロジェクトのルートディレクトリ（package.json がある場所）に .env ファイルを作成し、以下の内容を書き込んでください。

注意: 各変数の値によって、ダブルクォーテーション（""）の有無が異なります。記述ミスにご注意ください。

```
# Supabase (クォーテーションなし)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# データベース接続文字列（Prismaが使用 / ダブルクォーテーションで囲む）
DATABASE_URL="postgresql://..."

# Gemini API (クォーテーションなし)
GEMINI_API_KEY=your_gemini_api_key

# GASのデプロイURL（ダブルクォーテーションで囲む）
NEXT_PUBLIC_GAS_URL="https://script.google.com/macros/s/.../exec"
```

## 4. データベースのセットアップ (Prisma)
データベースのスキーマを反映させるため、以下のコマンドを実行します。

```bash
npx prisma db push
```

## 5. アプリケーションの起動
すべての準備が整ったら、開発サーバーを起動します。

```bash
npm run dev
```

起動後、ブラウザで http://localhost:3000 にアクセスして動作確認を行ってください。
