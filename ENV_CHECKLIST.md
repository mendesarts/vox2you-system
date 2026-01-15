# CHECKLIST DE PRODUÇÃO (VERCEL)
Antes de concluir o deploy, vá em Settings > Environment Variables na Vercel e garanta que estas chaves estão lá:

### 1. Banco de Dados (Neon)
- DATABASE_URL (URL do Neon para conexão via Sequelize)

### 2. Inteligência Artificial (Gemini)
- GEMINI_API_KEY (Chave da API obtida no Google AI Studio)

### 3. Sistema & Segurança
- NODE_ENV=production
- JWT_SECRET (Chave para assinatura de tokens de login)
- VITE_API_URL (URL final do seu sistema na Vercel + /api)
- INTEGRATION_TOKEN (Token para webhooks de marketing - opcional)

### 4. Google Cloud (Opcional/Futuro)
*Nota: Se você for usar Vertex AI em vez do AI Studio, estas serão necessárias:*
- GOOGLE_PROJECT_ID
- GOOGLE_PRIVATE_KEY
- GOOGLE_CLIENT_EMAIL
