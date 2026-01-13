# CHECKLIST DE PRODUÇÃO (VERCEL)
Antes de concluir o deploy, vá em Settings > Environment Variables na Vercel e garanta que estas chaves estão lá:

### 1. Banco de Dados (Neon)
- DATABASE_URL (Deve ser a URL "Pooled" do Neon para melhor performance em Serverless)
- DIRECT_URL (URL direta para migrações)

### 2. Google Cloud (Vertex AI / Gemini)
- GOOGLE_PROJECT_ID
- GOOGLE_PRIVATE_KEY (Cuidado com as quebras de linha!)
- GOOGLE_CLIENT_EMAIL

### 3. Sistema
- NODE_ENV=production
- VITE_API_URL=https://meuvoxflow.vercel.app/api
- API_SECRET (Sua senha interna de segurança)
- JWT_SECRET (Para autenticação de tokens)
