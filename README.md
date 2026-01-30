# EVEM Chat

EVEM Japan社内向けAIチャットアプリケーション。Next.js (App Router) + TypeScript で構築され、Supabase（認証・DB）とDify（LLM）を使用しています。

## 機能

- 🔐 Google認証（@evem-japan.com ドメイン限定）
- 💬 AIチャット（Dify advanced-chat API連携）
- 📝 スレッド管理（会話履歴の保存）
- ⚡ ストリーミングレスポンス（タイプライター効果）
- 📱 レスポンシブデザイン

## 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Auth/DB**: Supabase
- **LLM**: Dify (advanced-chat API)
- **Deploy**: Netlify
- **Node.js**: 18以上推奨（20推奨）

---

## 🚀 最短デプロイ（Netlify）- コピペ3ステップ

### Step 1: GitHubへプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git branch -M main
git push -u origin main
```

### Step 2: Netlifyでデプロイ

1. [Netlify](https://app.netlify.com/) にログイン
2. 「Add new site」→「Import an existing project」→ GitHub連携
3. リポジトリを選択（ビルド設定は自動検出）
4. 「Site configuration」→「Environment variables」で以下を設定：

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | (Supabase URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase Anon Key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (Supabase Service Role Key) |
| `DIFY_BASE_URL` | https://api.dify.ai/v1 |
| `DIFY_API_KEY` | (Dify API Key) |
| `ALLOWED_EMAIL_DOMAIN` | evem-japan.com |

5. 「Deploy」をクリック

### Step 3: SupabaseのRedirect URLs更新

デプロイ完了後、Netlify URLを取得（例: `https://evem-chat.netlify.app`）して：

1. Supabase Dashboard → Authentication → URL Configuration
2. 「Redirect URLs」に追加：
   ```
   https://<YOUR_NETLIFY_SITE>.netlify.app/**
   ```
3. 保存

**動作確認**: `https://<YOUR_NETLIFY_SITE>.netlify.app/login` にアクセス

---

## セットアップ手順

### 1. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```env
# ===== .env.local テンプレート =====

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Dify API
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=

# Security
ALLOWED_EMAIL_DOMAIN=evem-japan.com
```

### 2. Supabase設定

#### 2.1 プロジェクト作成
1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. プロジェクトのURL、anon key、service role keyを取得

#### 2.2 テーブル作成
Supabase SQL Editorで以下のSQLを実行：

```sql
-- threads テーブル作成
CREATE TABLE public.threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '新しいチャット',
  dify_conversation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックス作成
CREATE INDEX idx_threads_user_id ON public.threads(user_id);
CREATE INDEX idx_threads_updated_at ON public.threads(updated_at DESC);

-- RLS（Row Level Security）有効化
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- ポリシー作成: ユーザーは自分のスレッドのみアクセス可能
CREATE POLICY "Users can view own threads" ON public.threads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own threads" ON public.threads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threads" ON public.threads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads" ON public.threads
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON public.threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2.3 Google OAuth Provider 設定
1. Supabase Dashboard → Authentication → Providers → Google
2. Google Cloud Console で OAuth 2.0 クライアントID を作成
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みのリダイレクトURI:
     - ローカル開発: `http://localhost:3000/auth/callback`
     - 本番: `https://<YOUR_NETLIFY_SITE>.netlify.app/auth/callback`
     - Supabaseの追加リダイレクトURI: `https://<YOUR_PROJECT>.supabase.co/auth/v1/callback`
3. Google Cloud Console で OAuth 同意画面を設定
4. Supabase に Client ID と Client Secret を設定

#### 2.4 Supabase URL Configuration（重要）

Supabase Dashboard → Authentication → URL Configuration：

| 設定項目 | ローカル開発 | 本番 (Netlify) |
|---------|-------------|---------------|
| **Site URL** | `http://localhost:3000` | `https://<YOUR_NETLIFY_SITE>.netlify.app` |
| **Redirect URLs** | `http://localhost:3000/**` | `https://<YOUR_NETLIFY_SITE>.netlify.app/**` |

> **💡 Tips**: 両方のURLをRedirect URLsに登録しておくと、ローカルと本番を切り替え可能。

### 3. Dify設定

1. [Dify](https://dify.ai/) でアカウント作成
2. Advanced Chat アプリを作成
3. API Access → API Key を取得
4. Base URL は通常 `https://api.dify.ai/v1`

---

## ローカル起動手順

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（ポート3000固定）
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

---

## Netlifyデプロイ

### 1. Netlify CLIでのデプロイ

```bash
# Netlify CLI インストール
npm install -g netlify-cli

# ログイン
netlify login

# プロジェクトリンク
netlify init

# デプロイ（プレビュー）
netlify deploy

# 本番デプロイ
netlify deploy --prod
```

### 2. GitHub連携でのデプロイ（推奨）

1. GitHubにリポジトリをプッシュ
2. Netlifyダッシュボードで「Add new site」→「Import an existing project」
3. GitHubリポジトリを選択
4. ビルド設定（自動検出されるが確認用）:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. 環境変数を設定（Site settings → Environment variables）

### 3. Netlify環境変数設定

Netlifyダッシュボードで以下の環境変数を設定：

| Key | Value |
|-----|-------|
| `DIFY_BASE_URL` | https://api.dify.ai/v1 |
| `DIFY_API_KEY` | (Dify API Key) |
| `NEXT_PUBLIC_SUPABASE_URL` | (Supabase URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase Anon Key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (Supabase Service Role Key) |
| `ALLOWED_EMAIL_DOMAIN` | evem-japan.com |

### 4. 本番URLの更新

デプロイ後、Supabaseの設定を更新：
1. Authentication → URL Configuration → Site URL を本番URLに変更
2. Redirect URLs に本番の callback URL を追加

---

## セキュリティ

- **Dify API Key**: サーバーサイドのみで使用。クライアントには露出しません。
- **Supabase Service Role Key**: サーバーサイドのみで使用。クライアントには露出しません。
- **ドメイン制限**: `@evem-japan.com` のメールアドレスのみログイン可能。フロントエンドとバックエンドの両方で検証。
- **RLS**: Supabaseの Row Level Security により、ユーザーは自分のデータのみアクセス可能。

---

## ディレクトリ構造

```
evem-chat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts      # チャットAPI（SSE）
│   │   │   ├── thread/route.ts    # スレッド作成API
│   │   │   └── threads/route.ts   # スレッド一覧API
│   │   ├── auth/
│   │   │   └── callback/route.ts  # OAuth callback
│   │   ├── app/
│   │   │   └── page.tsx           # チャット画面
│   │   ├── login/
│   │   │   └── page.tsx           # ログイン画面
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ChatArea.tsx           # チャットエリア
│   │   └── ThreadList.tsx         # スレッド一覧
│   ├── lib/
│   │   ├── auth.ts                # ドメイン検証
│   │   └── supabase/
│   │       ├── client.ts          # ブラウザ用クライアント
│   │       └── server.ts          # サーバー用クライアント
│   ├── types/
│   │   └── index.ts               # 型定義
│   └── middleware.ts              # 認証ミドルウェア
├── netlify.toml
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## トラブルシューティング

### Google認証が動作しない
- Google Cloud Console で OAuth 同意画面のステータスを確認
- リダイレクトURIが正しく設定されているか確認
- Supabase の Site URL と Redirect URLs が正しいか確認
- ブラウザのコンソールで `[Auth Error]` ログを確認

### チャットが送信できない
- Dify API Key が正しいか確認
- Dify アプリが公開されているか確認
- ブラウザのコンソールでエラーを確認

### 「ドメインが許可されていません」エラー
- `@evem-japan.com` 以外のメールアドレスではログインできません
- `ALLOWED_EMAIL_DOMAIN` 環境変数を確認

### 認証エラーのデバッグ
認証失敗時は `/login?error=auth_error` にリダイレクトされます。
- ブラウザのコンソールに `[Auth Error]` としてエラーコードと詳細が出力されます
- サーバーログに `[Auth Callback Error]` としてエラー情報が記録されます

---

## ライセンス

Private - EVEM Japan internal use only.
