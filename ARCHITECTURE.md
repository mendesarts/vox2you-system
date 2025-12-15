# Arquitetura do Sistema Vox2you

## Visão Geral
Sistema integrado de gestão comercial e acadêmica (ERP + CRM) com agente SDR baseado em IA para automação de atendimento via WhatsApp.

## Stack Tecnológico
- **Frontend**: React (Vite), Vanilla CSS (CSS Modules/Global).
- **Backend (Proposto)**: Node.js (Express/NestJS).
- **Banco de Dados**: PostgreSQL.
- **IA**: Integração com LLMs (OpenAI/Anthropic) via API, gerenciado pelo backend.
- **Mensageria**: WhatsApp Business API (via Twilio/Wati/360dialog).

## Modelagem de Dados (Esboço SQL/ERD)

### 1. Users (Usuários do Sistema)
- id (UUID)
- name, email, password_hash
- role (admin, instructor, consultant, viewers)
- 2fa_enabled (boolean)

### 2. Leads (CRM)
- id (UUID)
- name, phone, email, city
- source (Ads, Organic, Referral)
- status (NEW, QUALIFICATION, SCHEDULED, DONE, ENROLLED, LOST)
- temperature (Hot, Warm, Cold)
- next_follow_up (timestamp)
- metadata (JSONB - interesses, conversas)

### 3. Students (Alunos)
- id (UUID)
- lead_id (FK)
- enrollment_date
- active (boolean)

### 4. Classes (Turmas/Aulas)
- id (UUID)
- name
- instructor_id (FK)
- course_name
- schedule (JSONB - dias/horários)

### 5. Consultations (Agendamentos)
- id (UUID)
- lead_id (FK)
- consultant_id (FK)
- start_time, end_time
- status (Scheduled, Completed, No-Show, Canceled)
- outcome_notes

### 6. Transactions (Financeiro)
- id (UUID)
- student_id (FK)
- type (Income, Expense)
- amount, due_date, paid_date
- method (PIX, Credit Card, Boleto)

## Fluxos de Automação IA (SDR)
1. **Webhook Receiver**: Recebe mensagem do WhatsApp.
2. **Context Loader**: Carrega histórico e dados do Lead do DB.
3. **LLM Processor**:
   - Analisa intenção.
   - Usa "System Prompt" com regras de negócio (PDFs/Docs indexados).
   - Decide próxima ação (Responder, Agendar, Escalar para Humano).
4. **Action Executor**:
   - Envia mensagem.
   - Atualiza CRM (Muda coluna Kanban).
   - Cria agendamento no Banco.

## Estrutura do Projeto
- `/client`: Frontend React.
- `/server`: Backend API (Node.js).
- `/docs`: Documentação e Prompts.
