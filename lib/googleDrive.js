// lib/googleDrive.js
const gasUrl = process.env.NEXT_PUBLIC_GAS_URL

/**
 * ファイルを完全非公開で保存し、既存DBにそのまま保存できる「専用アクセスURL」を返す
 * @param {File} WebFile
 * @returns {Promise<string>} prismaの url カラムにそのまま渡せるURL
 */
export async function uploadToGoogleDrive(WebFile) {
  const bytes = await WebFile.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64File = buffer.toString('base64');

  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: base64File, name: WebFile.name, type: WebFile.type })
  });

  const result = await response.json();
  if (!result.success) throw new Error(result.error);

  // 💡 ここがポイント：既存のDB（urlカラム）に保存するための「疑似URL」を生成して返します！
  // これにより、既存の prisma.file.create は1文字も触らずにそのまま動きます。
  const driveUrl = `${gasUrl}?id=${result.fileId}`;
  return driveUrl;
}

/**
 * 既存DBに保存されているurlを渡すと、Google Driveからファイルを綺麗に消し去る関数
 * @param {string} driveUrl - DBの url カラムに保存されている文字列
 */
export async function deleteFromGoogleDrive(driveUrl) {
  if (!driveUrl) return;

  try {
    // URLの末尾にある「?id=xxxxxx」から、ファイルID（xxxxxxの部分）だけを抽出する
    const urlObj = new URL(driveUrl);
    const fileId = urlObj.searchParams.get('id');

    if (!fileId) throw new Error('URLからファイルIDを抽出できませんでした');

    // GASの削除窓口に向けて、「これ消しといて！」とPOSTする
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        fileId: fileId
      })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(`GAS側でのファイル削除に失敗: ${result.error}`);
    }

    console.log(`【成功】Google Driveからファイル(${fileId})を削除しました`);
  } catch (error) {
    console.error('【Google Drive削除エラー】:', error);
    throw error; // 親元（APIルート）でエラーハンドリングできるように上に投げる
  }
}

/**
 * DBのurlからGoogle DriveのファイルをGETで取得し、Bufferとして返す関数
 * @param {string} driveUrl - DBの url カラムに保存されている文字列
 * @param {string} [fallbackMimeType] - API側から渡す正しいMIMEタイプ（任意）
 * @param {string} [fallbackFileName] - API側から渡す正しいファイル名（任意）
 * @returns {Promise<{ buffer: Buffer, mimeType: string, fileName: string }>}
 */
export async function downloadFromGoogleDrive(driveUrl, fallbackMimeType, fallbackFileName) {
  if (!driveUrl) throw new Error('URLが空です');

  try {
    const response = await fetch(driveUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`GASからのファイル取得に失敗しました。ステータス: ${response.status}`);
    }

    const base64String = await response.text();

    if (base64String.startsWith("Error:")) {
      throw new Error(`GAS側エラー: ${base64String}`);
    }

    // 返ってきたBase64文字列をNode.jsのBufferに変換
    const buffer = Buffer.from(base64String, 'base64');

    // 引数でDBに保存されている正しいタイプや名前が渡されていればそれを使い、
    // なければレスポンスヘッダーやデフォルト値で補完する
    const mimeType = fallbackMimeType || response.headers.get("content-type") || "application/octet-stream";
    const fileName = fallbackFileName || "downloaded_file";

    return {
      buffer,
      mimeType, 
      fileName
    };
  } catch (error) {
    console.error('【Google Driveダウンロードエラー】:', error);
    throw error;
  }
}