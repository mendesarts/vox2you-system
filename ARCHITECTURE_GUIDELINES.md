# 🛠️ VoxFlow System Architecture Guidelines (Source of Truth)

**PARA A IA / DESENVOLVEDOR:** Este sistema utiliza uma arquitetura robusta baseada em **IDs Numéricos** para toda a lógica de negócio, permissões e relacionamentos. Nunca utilize strings (nomes) para validações de cargos, unidades ou status.

### 1. Regra de Ouro: Proibido Uso de Strings para Lógica
- **❌ RUIM:** `if (user.role === 'master')` ou `if (lead.unit === 'Matriz')`
- **✅ BOM:** `if (Number(user.roleId) === 1)` ou `if (lead.unitId === 1)`

### 2. Mapeamento de Cargos (Master Role Guide)
Sempre utilize as constantes numéricas. O arquivo de referência no backend é `server/config/roles.js`.

| roleId | Nome Técnico (Slug) | Nome de Exibição | Nível de Acesso |
| :--- | :--- | :--- | :--- |
| **1** | master | Master | Acesso Total (Cross-unidades) |
| **10** | director | Diretor | Acesso Estratégico Global |
| **20** | franchisee | Franqueado | Gestão Completa da Unidade |
| **30** | manager | Gestor Geral | Gestão Operacional da Unidade |
| **40** | sales_leader | Líder Comercial | Gestão do CRM e Vendas da Unidade |
| **41** | consultant | Consultor | Operação de Vendas (Vê apenas seus leads) |
| **50** | pedagogical_leader | Coord. Pedagógico | Gestão de Alunos e Turmas da Unidade |
| **51** | instructor | Instrutor / Prof. | Gestão de Aulas e Presença |
| **60** | financial_admin | Financeiro | Gestão de Fluxo de Caixa e DRE |
| **61** | admin | Secretaria | Gestão Burocrática e Matrículas |

### 3. Hierarquia de Visibilidade e Filtros
- **Global Users (`[1, 10]`)**: Devem ter acesso a dados de **TODAS** as unidades. O filtro de unidades (`unitId`) deve permitir o valor `"all"` ou ser omitido para trazer o consolidado.
- **Unit Users (`[20, 30, 40, 50, 60, 61]`)**: Devem ter seus dados filtrados estritamente pelo `unitId` do usuário logado.
- **Privacity/Ownership (`[41, 51]`)**: Além do filtro de unidade, aplicar filtro por `consultant_id` ou `professor_id` para garantir que o operacional veja apenas sua carteira (quando aplicável).

### 4. Relacionamento de Unidades e IDs
- O relacionamento entre Usuários, Leads, Turmas e Financeiro é feito exclusivamente via `unitId` (Integer).
- **Importante:** Nunca utilize o campo `unit` (string) para filtros no banco de dados.

### 5. Boas Práticas de Código (Frontend & Backend)
- **Normalização de Tipos**: Use sempre `Number(id)` ao comparar IDs para garantir que `1 === "1"` não falhe silenciosamente.
- **Segurança no Backend**: O cargo e a unidade são extraídos do Token JWT (`req.user.roleId`, `req.user.unitId`). Nunca confie em IDs enviados pelo corpo da requisição (body) para filtros de segurança em usuários que não sejam Master.
- **Tratamento de Nulos**: Use encadeamento opcional `user?.roleId` e forneça valores padrão `Number(user?.roleId || 0)`.

---

**Nota:** Este documento serve como bússola para garantir a integridade do sistema. Qualquer refatoração deve respeitar a tipagem numérica dos identificadores.
