# Guia Passo a Passo para Iniciantes (Mac)

Olá! Siga este guia para colocar seu sistema Vox2you para funcionar.

## Passo 1: Instalar o "Motor" (Node.js)
O aviso apareceu porque seu computador ainda não tem o programa que lê o código que eu criei.

1.  Acesse o site oficial: **[https://nodejs.org](https://nodejs.org)**
2.  Baixe a versão que diz **LTS (Recomendado/Recommended)**. É o botão verde da esquerda.
3.  Abra o arquivo baixado `.pkg` e vá clicando em "Continuar", "Aceitar", "Instalar" (como instalar qualquer programa normal).
4.  **IMPORTANTE:** Quando a instalação terminar, **feche completamente a janela do Terminal** e abra uma nova. Isso é necessário para o computador reconhecer o novo programa.

## Passo 2: Ir até a pasta do projeto
Agora que o motor está instalado, vamos voltar para onde estávamos.
Copie o comando abaixo, cole no seu Terminal e aperte `Enter`:

```bash
cd /Users/mendesarts/.gemini/antigravity/scratch/vox2you-system
```

## Passo 3: Instalar tudo (fazer apenas uma vez)
Agora que você está na pasta certa, vamos instalar as ferramentas necessárias. Copie e cole este comando e aperte `Enter`:

```bash
./setup.sh
```
*Aguarde até aparecer a mensagem "Instalação concluída com sucesso!". Pode demorar uns minutos.*

## Passo 4: Rodar o Sistema
Para o sistema funcionar, precisamos de duas "partes" rodando ao mesmo tempo: o Cérebro (Backend) e a Cara (Frontend).

### Ligar o Servidor (Cérebro)
No terminal que já está aberto, digite:
```bash
cd server
npm run dev
```
*Não feche essa janela! Deixe ela rodando.*

### Ligar o Site (Frontend)
1. Abra uma **nova janela** do terminal (Tendo o terminal selecionado, aperte `Command (⌘) + N`).
2. Nessa nova janela, vá para a pasta novamente:
```bash
cd /Users/mendesarts/.gemini/antigravity/scratch/vox2you-system/client
```
3. Inicie o site:
```bash
npm run dev
```

## Passo 5: Acessar
No segundo terminal, vai aparecer um link local, geralmente:
👉 `http://localhost:5173`

Pressione a tecla `Command (⌘)` e clique nesse link, ou copie e cole no seu navegador (Chrome/Safari).

---

## Passo 6: Como usar o Sistema

Agora que tudo está rodando, acesse no seu navegador: **[http://localhost:5173](http://localhost:5173)**

### O que testar:

1.  **Dashboard**: Veja os gráficos e números fictícios.
2.  **CRM (Kanban)**:
    *   Clique no menu lateral em **CRM**.
    *   Tente arrastar um card de "Novo Lead" para "Qualificação".
    *   Isso simula o trabalho do time de vendas.
3.  **Agente SDR (Simulador IA)**:
    *   Vá em **SDR Agent**.
    *   No lado direito (celular), digite uma mensagem como se você fosse um cliente interessado.
    *   A IA (simulada) vai te responder automaticamente tentando agendar uma consultoria.
4.  **Admin e Calendário**: Navegue para ver as telas de gestão.

### Importante
Este é um **Protótipo Funcional**.
*   A "Inteligência Artificial" está no modo de simulação (respostas prontas) para você testar a interface sem gastar créditos reais.
*   Os dados (alunos, vendas) são fictícios para demonstração.
