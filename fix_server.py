import os

file_path = 'server/index.js'
marker = '// Initialize DB Connection'

new_code = """// Initialize DB Connection
const startServer = async () => {
    try {
        // 1. Inicia o servidor PRIMEIRO (Para o Google dar o Link Verde logo)
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // 2. Conecta no Banco depois (Sem travar o site)
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connection OK!');
        
        // 3. Sincroniza as tabelas
        await sequelize.sync({ alter: false });
        console.log('Database synced.');

    } catch (err) {
        console.error("Startup Warning:", err.message);
    }
};

startServer();
"""

with open(file_path, 'r') as f:
    content = f.read()

if marker in content:
    parts = content.split(marker)
    # Pega tudo o que vem antes do marcador e adiciona o novo codigo
    final_content = parts[0] + new_code
    
    with open(file_path, 'w') as f:
        f.write(final_content)
    print("Sucesso! O arquivo server/index.js foi corrigido.")
else:
    print("Erro: Marcador nao encontrado no arquivo.")
