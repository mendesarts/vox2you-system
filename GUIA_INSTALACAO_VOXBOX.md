# 📱 Guia de Instalação Rápida - VoxBox (Robô WhatsApp)

Este guia orienta a instalação do "motor" do WhatsApp (Worker Local) nos computadores das unidades.

> **Novidade (v2.0):** Agora o instalador cria um atalho na Área de Trabalho para facilitar o monitoramento.

---

## 🐧 Opção 1: Instalação Linux (Recomendado)

Ideal para servidores dedicados, Raspberry Pi ou computadores Linux da recepção.

### Passo 1: Baixar e Instalar
Abra o Terminal e cole o seguinte comando (tudo em uma linha):

```bash
# Substitua SEU_IP pelo IP do servidor onde o sistema Vox2You está rodando
wget -O instalar.sh https://meuvoxflow.vercel.app/api/installers/download-setup-linux && chmod +x instalar.sh && ./instalar.sh
```

### Passo 2: Conectar
1. O script vai instalar tudo automaticamente.
2. Ao finalizar, olhe para sua **Área de Trabalho**.
3. Você verá um novo ícone chamado **📱 Conectar WhatsApp**.
4. Clique duas vezes nele.
5. Uma janela preta abrirá mostrando o **QR Code**.
6. Escaneie com o WhatsApp do número da unidade.

---

## 🪟 Opção 2: Instalação Windows

Ideal para rodar no computador da recepção ou administrativo.

### Passo 1: Baixar o Instalador
1. Abra o navegador no computador onde o robô vai rodar.
2. Acesse: `https://meuvoxflow.vercel.app/api/installers/download-setup-win`
   *(Substitua SEU_IP pelo endereço do servidor)*.
3. O download do arquivo `VoxBox_Setup_Win.bat` começará.

### Passo 2: Executar
1. Vá até a pasta Downloads.
2. Clique com botão direito no arquivo `VoxBox_Setup_Win.bat` e escolha **Executar como Administrador**.
3. Uma tela preta aparecerá instalando os componentes (Node.js, Git, etc.).

### Passo 3: Conectar
1. Ao terminar, vá para a **Área de Trabalho**.
2. Procure o atalho **Conectar_WhatsApp**.
3. Clique nele para abrir a tela de monitoramento e ver o **QR Code**.

---

## 🆘 Solução de Problemas

**Ícone não abre nada (Linux):**
*   Clique com botão direito no ícone > "Permitir Lançamento" (Allow Launching).

**QR Code não aparece (Windows):**
*   Verifique se não há outro programa usando a porta 3000.
*   Reinicie o computador e tente abrir o atalho novamente.

**Como saber se está funcionando?**
*   No painel do sistema Vox2You, envie uma mensagem de teste para o número conectado.
