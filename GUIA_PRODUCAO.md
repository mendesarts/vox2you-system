# Guia: Transformando o Protótipo em Sistema Real

Atualmente, você tem um "carro conceito": ele é lindo e mostra como tudo funciona, mas o motor é de mentirinha (dados fictícios). Para transformá-lo num carro de corrida real, precisamos de 3 passos principais:

## 1. Conectar o "Cérebro" Real (Backend e Banco de Dados)
Hoje, ao atualizar a página, os dados voltam ao original. Para salvar de verdade:
- **Banco de Dados**: Precisamos instalar o **PostgreSQL** para guardar alunos, leads e histórico.
- **Conexão**: Configurar o código do servidor (`server/`) para ler/escrever nesse banco.

## 2. Ligar as Integrações (WhatsApp e IA)
O chat atual é um simulador.
- **WhatsApp**: Você precisará contratar um provedor oficial (Twilio, Wati ou 360dialog). Isso gera uma "Chave de API" que colocamos no código.
- **Inteligência Artificial**: Precisamos criar uma conta na OpenAI (criadora do ChatGPT), pegar a chave de acesso e colocar no sistema. Assim, o robô responderá com inteligência real, não com frases prontas.

## 3. Colocar na Internet (Hospedagem)
Para que você e sua equipe acessem de qualquer lugar (não só do seu computador):
- **Frontend (Site)**: Recomendo usar **Vercel** ou **Netlify** (são gratuitos para começar).
- **Backend (Servidor)**: Recomendo **Render** ou **Railway**.
- **Domínio**: Comprar `sistema.vox2you.com.br` e configurar.

---

## Como Personalizar Agora?

Se você quer mudar cores, logo ou textos **agora**, você precisa editar os arquivos de código na pasta `client`.

### Mudar o Nome/Logo
1. Vá em `client/src/components/Sidebar.jsx`.
2. Procure onde diz "Vox2System" e mude para o que quiser.

### Mudar as Cores
1. Vá em `client/src/index.css`.
2. No começo do arquivo, você verá códigos de cores (ex: `#10b981`).
3. Mude esses códigos para as cores da sua marca.

### Mudar as Regras do Agente IA
1. Vá em `client/src/pages/SDRChat.jsx`.
2. Procure o texto dentro de `const [prompt, setPrompt]`. Ali estão as regras que o robô segue.

---

**Próximo Passo Recomendado:**
Quer que eu te ajude a fazer uma dessas personalizações simples agora (tipo mudar o logo) para você ver como funciona?
