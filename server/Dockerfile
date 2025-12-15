# Usa a imagem COMPLETA do Node (tem todas as ferramentas de compilacao)
FROM node:18

# Define a pasta de trabalho
WORKDIR /app

# Copia o package.json
COPY package.json ./

# Instala as dependencias
RUN npm install

# Copia o resto do codigo
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Inicia o servidor
CMD ["node", "index.js"]
