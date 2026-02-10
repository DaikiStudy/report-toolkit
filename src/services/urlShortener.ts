export async function shortenUrl(longUrl: string): Promise<string> {
  const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`;

  // 直接アクセスを試行
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const result = await response.text();
      if (!result.startsWith('Error:')) return result.trim();
      throw new Error(result);
    }
  } catch (e) {
    // CORSブロック時は下のプロキシにフォールバック
    if (e instanceof Error && e.message.startsWith('Error:')) throw e;
  }

  // CORSプロキシ経由でリトライ
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('URL短縮に失敗しました');
    const result = await response.text();
    if (result.startsWith('Error:')) throw new Error(result);
    return result.trim();
  } catch {
    throw new Error('URL短縮サービスに接続できませんでした。ネットワークを確認してください。');
  }
}
