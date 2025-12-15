# ☁️ Guia de Deploy no Google Cloud Platform (VoxFlow)

Este guia explica como colocar o **VoxFlow** para rodar na nuvem do Google (GCP) usando **Cloud Run** (para servidor e site) e **Cloud SQL** (para o banco de dados PostgreSQL).

---

## 🏗️ Visão Geral da Arquitetura

1.  **Backend (Server):** Rodará em um container no **Cloud Run**.
2.  **Frontend (Client):** Rodará em outro container no **Cloud Run** (ou Firebase Hosting).
3.  **Banco de Dados:** Instância gerenciada no **Cloud SQL (PostgreSQL)**.

---

## 🛠️ Passo 1: Preparar o Projeto

1.  Instale o [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) na sua máquina.
2.  Faça login: `gcloud auth login`
3.  Configure o projeto: `gcloud config set project [SEU_ID_DO_PROJETO]`

---

## 🗄️ Passo 2: Criar Banco de Dados (Cloud SQL)

1.  No Console do GCP, vá em **SQL** e crie uma instância **PostgreSQL**.
2.  Crie um banco de dados chamado `voxflow_prod`.
3.  Crie um usuário/senha (ex: `voxflow_user` / `senha_segura`).
4.  Copie o **"Connection Name"** da instância (algo como `projeto:regiao:instancia`).

---

## 🚀 Passo 3: Deploy do Servidor (Backend)

O servidor precisa se conectar ao Cloud SQL. O Cloud Run facilita isso.

1.  **Construir a imagem Docker:**
    ```bash
    cd server
    gcloud builds submit --tag gcr.io/[SEU_ID_DO_PROJETO]/voxflow-server
    ```

2.  **Fazer o Deploy:**
    ```bash
    gcloud run deploy voxflow-server \
      --image gcr.io/[SEU_ID_DO_PROJETO]/voxflow-server \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --add-cloudsql-instances [CONNECTION_NAME_DO_PASSO_2] \
      --set-env-vars="NODE_ENV=production,DATABASE_URL=postgres://voxflow_user:senha_segura@/voxflow_prod?host=/cloudsql/[CONNECTION_NAME_DO_PASSO_2]"
    ```

    *Nota: A string de conexão do socket unix varia. Consulte a doc do Cloud SQL se tiver dúvidas.*

    **Copie a URL gerada** (ex: `https://voxflow-server-xyz.a.run.app`).

---

## 🌐 Passo 4: Deploy do Site (Frontend)

O site precisa saber onde o servidor está.

1.  **Editar Dockerfile do Client (Opcional):**
    Para produção real, recomendamos usar Nginx para servir os estáticos, mas o comando `npm run dev --host` do Dockerfile atual funciona para testes (embora não seja ideal para escala massiva).
    
    *Melhor Prática:* Alterar o `client/Dockerfile` para fazer o build (`npm run build`) e servir a pasta `dist`.

2.  **Configurar URL da API:**
    Como o build do Vite é estático, a variável de ambiente precisa ser injetada no momento do BUILD ou em tempo de execução. Para simplificar no Cloud Run:

    No `client/vite.config.js`, garanta que ele lê `process.env.VITE_API_URL` ou use um proxy.

3.  **Construir e Deploy:**
    ```bash
    cd client
    gcloud builds submit --tag gcr.io/[SEU_ID_DO_PROJETO]/voxflow-client
    
    gcloud run deploy voxflow-client \
      --image gcr.io/[SEU_ID_DO_PROJETO]/voxflow-client \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="VITE_API_URL=https://voxflow-server-xyz.a.run.app" 
    ```

---

## ✅ Conclusão

Agora você tem:
*   [x] Banco de dados escalável e seguro (Cloud SQL).
*   [x] Backend rodando em container serverless (Cloud Run).
*   [x] Frontend acessível globalmente.

Acesse a URL do **voxflow-client** para usar o sistema!
