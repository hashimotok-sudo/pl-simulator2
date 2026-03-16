# EC販売 PLシミュレーター

## 起動方法

### 1. Node.jsをインストール（未インストールの場合）
https://nodejs.org から LTS版をダウンロード

### 2. このフォルダをターミナルで開いて実行

```bash
npm install
npm run dev
```

### 3. ブラウザで開く
http://localhost:5173

---

## ビルド（本番公開用）

```bash
npm run build
```
`dist/` フォルダが生成されます。サーバーに置けば公開できます。

## Netlify/Vercelで公開する場合
GitHubにアップロードして連携するだけで自動デプロイされます。
