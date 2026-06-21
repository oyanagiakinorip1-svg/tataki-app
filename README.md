# アプリの実行方法
1. リポジトリのクローン
2. SupabaseとGoogleDriveを用意
3. gasフォルダのcodeをGASに書き込む。この際"YOUR_FOLDER_ID"をデータ保存用の個人GoogleDriveフォルダのURLに置き換える
4. .envフォルダを作成し対応したkeyを書き込む(詳細は以下参照)
5. npm run devで実行

.envファイル(""の有無に注意)
```
# .env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# データベース接続文字列（Prismaが使う）
DATABASE_URL=""

GEMINI_API_KEY=
NEXT_PUBLIC_GAS_URL=""
```
