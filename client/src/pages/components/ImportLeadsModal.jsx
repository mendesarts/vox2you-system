import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { X, Upload, ArrowRight, Check, AlertCircle, User } from 'lucide-react';
import { api } from '../../services/api';

const SYSTEM_FIELDS = [
    { key: 'origin_id_importado', label: '🆔 ID Original (Importado)' },
    { key: 'name', label: '👤 Nome do Lead' },
    { key: 'phone', label: '📱 WhatsApp / Celular' },
    { key: 'email', label: '📧 E-mail' },
    { key: 'profession', label: '💼 Profissão' },
    { key: 'neighborhood', label: '🏘️ Bairro' },
    { key: 'city', label: '🏙️ Cidade' },
    { key: 'address', label: '📍 Endereço' },
    { key: 'state', label: '🏳️ Estado (UF)' },
    { key: 'cep', label: '📬 CEP' },
    { key: 'cpf', label: '📄 CPF' },
    { key: 'rg', label: '📄 RG' },
    { key: 'birthDate', label: '🎂 Data de Nascimento' },
    { key: 'createdAt', label: '📅 Data de Criação' },
    { key: 'status', label: '📊 Etapa do Lead (Status)' },
    { key: 'observation', label: '📝 Observações / Notas' },
    { key: 'tags', label: '🏷️ Tags / Etiquetas' },
    { key: 'temperature', label: '🔥 Temperatura (Frio/Morno/Quente)' },
    { key: 'lossReason', label: '📉 Motivo de Perda' },
    { key: 'sales_value', label: '💰 Valor do Curso' },
    { key: 'venda', label: '💰 Venda' },
    { key: 'enrollment_value', label: '💳 Valor da Matrícula' },
    { key: 'material_value', label: '📚 Preço do Material' },
    { key: 'valor_material_didatico', label: '📚 Valor Material Didático' },
    { key: 'payment_method', label: '💳 Forma de Pagamento' },
    { key: 'installments', label: '🔢 Parcelas' },
    { key: 'qtd__de_parcela__cartao_de_credito_', label: '🔢 Qtd. Parcelas Cartão' },
    { key: 'card_brand', label: '💳 Bandeira do Cartão' },
    { key: 'bandeira__cartao_de_credito_', label: '💳 Bandeira Cartão (Especial)' },
    { key: 'source', label: 'Origem (Source)' },
    { key: 'media', label: 'Mídia (Medium)' },
    { key: 'utm_source', label: 'UTM: Source' },
    { key: 'utm_medium', label: 'UTM: Medium' },
    { key: 'utm_campaign', label: 'UTM: Campaign' },
    { key: 'utm_term', label: 'UTM: Term' },
    { key: 'utm_content', label: 'UTM: Content' },
    { key: 'utm_referrer', label: 'UTM: Referrer' },
    { key: 'referrer', label: 'Referrer (Página)' },
    { key: 'gclientid', label: 'GClientId' },
    { key: 'gclid', label: 'GClid' },
    { key: 'fbclid', label: 'FBClid' },
    { key: 'courseInterest', label: 'Interesse: Curso' },
    { key: 'responsible', label: 'Usuário Responsável' },
    { key: 'unit', label: 'Unidade' },
    { key: 'funnel', label: 'Funil' },
    { key: 'updatedAt', label: 'Última Modificação' },
    { key: 'nextActionAt', label: 'Próxima Tarefa' },
    { key: 'lastScheduleDate', label: 'Data Último Agendamento' },
    { key: 'consultancyDate', label: 'Data da Reunião' },
    { key: 'enrollmentDate', label: 'Data da Matrícula' },
    { key: 'sdr_id', label: 'SDR Responsável' },
    { key: '__sdr', label: '## SDR (Campo Especial)' },
    { key: 'quantity', label: 'Quantidade' },
    { key: 'company', label: 'Empresa / Organização' },
    { key: 'secondary_phone', label: 'Telefone Secundário' },
    { key: 'secondary_email', label: 'E-mail Secundário' },
    { key: 'position', label: 'Cargo / Posição' },
    { key: 'posicao__contato_', label: 'Cargo (Contato)' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'organization_id', label: 'ID da Organização' },
    { key: 'bank_code', label: 'Código Bancário' },
    { key: 'real_address', label: 'Endereço Real (Logradouro)' },
    { key: 'endereco__contato_', label: 'Endereço (Contato)' },
    { key: 'connection_done', label: 'Conexão Realizada' },
    { key: 'connection_date', label: 'Data da Conexão' },
    { key: 'connection_channel', label: 'Canal da Conexão' },
    { key: 'criado_por', label: 'Criado Por' },
    { key: 'modificado_por', label: 'Modificado Por' },
    { key: 'fechada_em', label: 'Fechada em (Data)' },
    { key: 'sobre_o_lead', label: 'Sobre o Lead' },
    { key: 'marketing', label: 'Marketing (Campo Extra)' },
    { key: 'insucesso', label: 'Insucesso (Campo Extra)' },
    { key: 'tentativas_de_contato', label: 'Tentativas de Contato' },
    { key: 'resultado_1__tentativa', label: 'Resultado 1ª Tentativa' },
    { key: 'resultado_2__tentativa', label: 'Resultado 2ª Tentativa' },
    { key: 'resultado_3__tentativa', label: 'Resultado 3ª Tentativa' },
    { key: 'resultado_4__tentativa', label: 'Resultado 4ª Tentativa' },
    { key: 'resultado_5__tentativa', label: 'Resultado 5ª Tentativa' },
    { key: '1_agendamento_de_entrevista', label: '1 Agendamento Entrevista' },
    { key: 'data_e_hora_da_entrevista___1', label: 'Data/Hora Entrevista 1' },
    { key: 'resultado_entrevista___1', label: 'Resultado Entrevista 1' },
    { key: '2_agendamento_de_entrevista', label: '2 Agendamento Entrevista' },
    { key: 'data_e_hora_da_entrevista___2', label: 'Data/Hora Entrevista 2' },
    { key: 'resultado_entrevista___2', label: 'Resultado Entrevista 2' },
    { key: '3_agendamento_de_entrevista', label: '3 Agendamento Entrevista' },
    { key: 'data_e_hora_da_entrevista___3', label: 'Data/Hora Entrevista 3' },
    { key: 'resultado_entrevista___3', label: 'Resultado Entrevista 3' },
    { key: '4_agendamento_de_entrevista', label: '4 Agendamento Entrevista' },
    { key: 'data_e_hora_da_entrevista___4', label: 'Data/Hora Entrevista 4' },
    { key: 'resultado_entrevista___4', label: 'Resultado Entrevista 4' },
    { key: 'tipo_de_entrevista', label: 'Tipo de Entrevista' },
    { key: 'entrevista_realizada', label: 'Entrevista Realizada' },
    { key: 'data_e_hora_da_entrevista_realizada', label: 'Data/Hora Entrevista Realizada' },
    { key: 'visita', label: 'Visita (Campo Extra)' },
    { key: 'visitou_a_unidade_', label: 'Visitou a Unidade?' },
    { key: 'data_e_hora_da_visita', label: 'Data e Hora da Visita' },
    { key: 'aula_experimental', label: 'Aula Experimental (Campo Extra)' },
    { key: 'agendamento_aula_experimental', label: 'Agendamento Aula Exp.' },
    { key: 'assistiu_a_aula_experimental_', label: 'Assistiu Aula Experimental?' },
    { key: 'facilitador_da_aula_experimental', label: 'Facilitador da Aula Exp.' },
    { key: 'cadencia_bolo', label: 'Cadência Bolo' },
    { key: 'follow_up_1', label: 'Follow Up 1' },
    { key: 'follow_up_2', label: 'Follow Up 2' },
    { key: 'follow_up_3', label: 'Follow Up 3' },
    { key: 'follow_up_4', label: 'Follow Up 4' },
    { key: 'follow_up_5', label: 'Follow Up 5' },
    { key: 'cadencia_negociacao', label: 'Cadência Negociação' },
    { key: 'follow_up_6', label: 'Follow Up 6' },
    { key: 'follow_up_7', label: 'Follow Up 7' },
    { key: 'registros_de_negociacao', label: 'Registros de Negociação' },
    { key: 'data_e_hora_da_negociacao', label: 'Data/Hora Negociação' },
    { key: 'motivo___interesse_do_lead', label: 'Motivo Interesse Lead' },
    { key: 'informacoes_sobre_pagamento', label: 'Info Sobre Pagamento' },
    { key: 'venda_com_subsidio', label: 'Venda com Subsídio' },
    { key: 'valores_de_pagamento', label: 'Valores de Pagamento (Campo Extra)' },
    { key: 'tipo_de_lead', label: 'Tipo de Lead' },
    { key: 'lead_veio_de_ads', label: 'Lead veio de Ads?' },
    { key: 'comercial', label: 'Comercial (Campo Extra)' },
    { key: 'encaminhado_para_vendedor', label: 'Encaminhado P/ Vendedor' },
    { key: 'data_encaminhado', label: 'Data Encaminhado' },
    { key: 'email_comercial__contato_', label: 'Email Comercial (Contato)' },
    { key: 'email_pessoal__contato_', label: 'Email Pessoal (Contato)' },
    { key: 'outro_email__contato_', label: 'Outro Email (Contato)' },
    { key: 'telefone_comercial__contato_', label: 'Fone Comercial (Contato)' },
    { key: 'celular__contato_', label: 'Celular (Contato)' },
    { key: 'tel__direto_com___contato_', label: 'Tel. Direto (Contato)' },
    { key: 'faz__contato_', label: 'Faz (Contato)' },
    { key: 'telefone_residencial__contato_', label: 'Fone Residencial (Contato)' },
    { key: 'outro_telefone__contato_', label: 'Outro Fone (Contato)' },
    { key: 'cpf__contato_', label: 'CPF (Contato)' },
    { key: 'data_de_nascimento__contato_', label: 'Nascimento (Contato)' },
    { key: 'rg__contato_', label: 'RG (Contato)' },
    { key: 'nota_1', label: 'Nota 1 (Importado)' },
    { key: 'nota_2', label: 'Nota 2 (Importado)' },
    { key: 'nota_3', label: 'Nota 3 (Importado)' },
    { key: 'nota_4', label: 'Nota 4 (Importado)' },
    { key: 'nota_5', label: 'Nota 5 (Importado)' },
    // Novas colunas para duplicatas
    { key: 'negociacao_1', label: 'Negociação 1' },
    { key: 'negociacao_2', label: 'Negociação 2' },
    { key: 'negociacao_3', label: 'Negociação 3' },
    { key: 'negociacao_4', label: 'Negociação 4' },
    { key: 'negociacao_5', label: 'Negociação 5' },
    { key: 'follow_up_1_2', label: 'Follow Up 1 (N2)' },
    { key: 'follow_up_2_2', label: 'Follow Up 2 (N2)' },
    { key: 'follow_up_3_2', label: 'Follow Up 3 (N2)' },
    { key: 'follow_up_4_2', label: 'Follow Up 4 (N2)' },
    { key: 'follow_up_5_2', label: 'Follow Up 5 (N2)' },
    { key: 'follow_up_1_3', label: 'Follow Up 1 (N3)' },
    { key: 'follow_up_2_3', label: 'Follow Up 2 (N3)' },
    { key: 'follow_up_3_3', label: 'Follow Up 3 (N3)' },
    { key: 'follow_up_4_3', label: 'Follow Up 4 (N3)' },
    { key: 'follow_up_5_3', label: 'Follow Up 5 (N3)' },
    { key: 'Marketing_2', label: '*Marketing_2*' },
    { key: 'data_vencimento', label: '📅 Data de Vencimento' },
    { key: 'consultancyDate', label: '📅 Data da Consultoria' },
    { key: 'enrollmentDate', label: '📅 Data da Matrícula' },
    { key: 'organization_id', label: '🆔 ID da Organização' },
    { key: 'bank_code', label: '🏦 Código do Banco' },
    { key: 'responsibleName', label: '👤 Nome Resp. Financeiro' },
    { key: 'cpf___responsavel_financeiro', label: '📄 CPF Resp. Financeiro' },
    { key: 'rg___responsavel_financeiro', label: '📄 RG Resp. Financeiro' },
    { key: 'email___responsavel_financeiro', label: '📧 Email Resp. Financeiro' },
    { key: 'telefone___responsavel_financeiro', label: '📱 Telefone Resp. Financeiro' }
];

const ImportLeadsModal = ({ isOpen, onClose, onImport, consultants = [], user, units = [] }) => {
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping
    const [file, setFile] = useState(null);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvData, setCsvData] = useState([]);
    const [mapping, setMapping] = useState({});
    const [responsibleMapping, setResponsibleMapping] = useState({});
    const [uniqueResponsibleNames, setUniqueResponsibleNames] = useState([]);

    // Global Defaults
    const [defaultResponsible, setDefaultResponsible] = useState(user?.id || '');
    const [defaultUnitId, setDefaultUnitId] = useState(user?.unitId || '');
    const [targetFunnel, setTargetFunnel] = useState('auto');
    const [dynamicFields, setDynamicFields] = useState([]);
    const [customFullMapping, setCustomFullMapping] = useState(null);
    const [isConfigLoaded, setIsConfigLoaded] = useState(false);

    const ALL_SYSTEM_FIELDS = [...SYSTEM_FIELDS, ...dynamicFields.map(f => ({
        key: f, label: `✨ ${f.replace(/_/g, ' ')} (Custom)`
    }))];

    useEffect(() => {
        if (isOpen) {
            const loadMapping = async () => {
                try {
                    const res = await api.get(`/crm/import/mapping?t=${Date.now()}`);
                    if (res) {
                        if (res.mapping) setCustomFullMapping(res.mapping);
                        if (res.customFields) setDynamicFields(res.customFields);
                        setIsConfigLoaded(true);
                    }
                } catch (e) {
                    console.error("Erro ao carregar mapeamento customizado:", e);
                    setIsConfigLoaded(true);
                }
            };
            loadMapping();

            setStep(1);
            setFile(null);
            setCsvHeaders([]);
            setCsvData([]);
            setMapping({});
            setDefaultResponsible(user?.id || '');

            // Robust Unit Defaults
            let initialUnitId = user?.unitId || '';
            if (!initialUnitId && user?.unit && units.length > 0) {
                const found = units.find(u => u.name === user.unit);
                if (found) initialUnitId = found.id;
            }
            setDefaultUnitId(initialUnitId);
            setTargetFunnel('auto');
            setResponsibleMapping({});
            setUniqueResponsibleNames([]);
        }
    }, [isOpen]);

    // Effect to scan for unique responsible names in spreadsheet
    useEffect(() => {
        try {
            const responsibleHeader = Object.keys(mapping).find(key => mapping[key] === 'responsible');
            if (responsibleHeader && Array.isArray(csvData) && csvData.length > 0) {
                // Safely extract unique names
                const uniqueNames = [...new Set(csvData
                    .filter(row => row && typeof row === 'object' && row[responsibleHeader])
                    .map(row => String(row[responsibleHeader]).trim())
                    .filter(v => v !== ''))
                ];

                setUniqueResponsibleNames(uniqueNames);

                // Try to auto-match unique names to consultants
                const initialRespMapping = { ...responsibleMapping };
                uniqueNames.forEach(name => {
                    const cleanName = String(name).toLowerCase().trim();
                    if (!initialRespMapping[name]) {
                        const match = Array.isArray(consultants) ? consultants.find(c => {
                            const cn = c?.name?.toLowerCase() || '';
                            return cn === cleanName || cn.includes(cleanName) || cleanName.includes(cn);
                        }) : null;
                        if (match) initialRespMapping[name] = match.id;
                    }
                });
                setResponsibleMapping(initialRespMapping);
            } else {
                setUniqueResponsibleNames([]);
            }
        } catch (err) {
            console.error('Error scanning responsible names:', err);
            setUniqueResponsibleNames([]);
        }
    }, [mapping, csvData, consultants]);

    const processParsedData = (data, headers) => {
        setCsvHeaders(headers);
        setCsvData(data);

        // Auto-Guess Logic (Smart Matching)
        const initialMapping = {};
        // Sync default responsible when user loads
        if (user?.id && !defaultResponsible) {
            setDefaultResponsible(user.id);
        }

        const normalize = (str) => String(str).toLowerCase().trim();

        // 1. Define Robust Aliases
        const KEYWORD_ALIASES = {
            origin_id_importado: ['id', 'lead id', 'externalid', 'id do contato', 'contact id', 'lead id'],
            name: ['nome do contato', 'contato', 'nome', 'full name', 'cliente', 'pessoa', 'contact name', 'contato principal', 'título', 'title', 'lead', 'nome do negócio', 'name'],
            phone: ['celular', 'whatsapp', 'telefone', 'phone', 'contact number', 'mobile', 'cel', 'tel', 'fone', 'fones', 'telefone comercial (contato)', 'telefone comercial', 'work phone', 'telefone de trabalho', 'tel.'],
            email: ['email', 'e-mail', 'correio eletronico', 'mail'],
            items: ['produto', 'curso de interesse', 'quantidade'],
            quantity: ['quantidade', 'quantity'],
            courseInterest: ['curso de interesse', 'produto', 'interesse', 'curso'],
            profession: ['profissao', 'profession', 'cargo', 'ocupacao'],
            neighborhood: ['bairro', 'neighborhood', 'distrito'],
            city: ['cidade', 'city', 'município', 'localidade'],
            address: ['endereço', 'address', 'rua', 'logradouro', 'avenida'],
            state: ['estado', 'uf', 'state', 'província'],
            cep: ['cep', 'zip', 'zipcode', 'codigo postal'],
            cpf: ['cpf', 'cpf do aluno', 'documento'],
            rg: ['rg', 'rg do aluno', 'identidade'],
            birthDate: ['data de nascimento', 'nascimento', 'aniversário', 'birthdate'],
            createdAt: ['data criada', 'criado em', 'data de criação', 'created at', 'created', 'data de cadastro'],
            status: ['etapa do lead', 'status', 'fase', 'stage', 'etapa', 'pipeline stage', 'status do lead'],
            observation: ['observação', 'notas', 'comentários', 'descrição', 'observations', 'notes', 'notas do negócio', 'resumo'],
            tags: ['lead tags', 'tags', 'etiquetas', 'marcadores'],
            temperature: ['temperatura', 'temperature', 'qualidade'],
            lossReason: ['motivo de insucesso', 'motivo', 'perda motivo', 'loss reason', 'motivo da perda'],
            sales_value: ['valor do curso', 'price', 'valor', 'budget', 'orçamento', 'lead value'],
            venda: ['venda'],
            enrollment_value: ['valor da matrícula', 'matricula', 'taxa de matrícula'],
            payment_method: ['forma de pagamento', 'método de pagamento'],
            installments: ['parcelas', 'número de parcelas', 'quantidade de parcelas'],
            qtd__de_parcela__cartao_de_credito_: ['qtd. de parcela (cartão de crédito)'],
            card_brand: ['bandeira do cartão', 'bandeira'],
            bandeira__cartao_de_credito_: ['bandeira (cartão de crédito)'],
            source: ['origem', 'source', 'fonte'],
            media: ['mídia', 'medium', 'campanha'],
            utm_source: ['utm_source', 'utm source'],
            utm_medium: ['utm_medium', 'utm medium'],
            utm_campaign: ['utm_campaign', 'utm campaign'],
            utm_term: ['utm_term', 'utm term'],
            utm_content: ['utm_content', 'utm content'],
            utm_referrer: ['utm_referrer', 'utm referrer'],
            responsible: ['responsável', 'lead usuário responsável', 'usuário responsável'],
            unit: ['unidade'],
            funnel: ['funil', 'funil de vendas', 'pipeline', 'processo de vendas', 'fluxo', 'origem do lead', 'processo'],
            company: ['empresa', 'company', 'empresa do contato', "empresa lead 's"],
            position: ['cargo', 'position', 'posição'],
            posicao__contato_: ['posição (contato)'],
            secondary_phone: ['telefone secundário'],
            secondary_email: ['email comercial'],
            cnpj: ['cnpj'],
            real_address: ['logradouro'],
            material_value: ['valor do material'],
            valor_material_didatico: ['valor material didático'],

            // Novos campos (Relacionamento Estrito)
            data_vencimento: ['Data de Vencimento'],
            consultancyDate: ['Data da Consultoria'],
            enrollmentDate: ['Data da Matrícula'],
            organization_id: ['ID da Organização'],
            bank_code: ['Código do Banco'],
            responsibleName: ['Nome Resp. Financeiro'],
            cpf___responsavel_financeiro: ['CPF Resp. Financeiro'],
            rg___responsavel_financeiro: ['RG Resp. Financeiro'],
            email___responsavel_financeiro: ['Email Resp. Financeiro'],
            telefone___responsavel_financeiro: ['Telefone Resp. Financeiro'],

            // History & Follow ups
            criado_por: ['criado por'],
            modificado_por: ['modificado por'],
            fechada_em: ['fechada em'],
            sobre_o_lead: ['*sobre o lead*', 'sobre o lead'],
            marketing: ['*marketing*', 'marketing'],
            insucesso: ['*insucesso*', 'insucesso'],
            tentativas_de_contato: ['*tentativas de contato*', 'tentativas de contato'],
            resultado_1__tentativa: ['resultado 1º tentativa'],
            resultado_2__tentativa: ['resultado 2º tentativa'],
            resultado_3__tentativa: ['resultado 3º tentativa'],
            resultado_4__tentativa: ['resultado 4º tentativa'],
            resultado_5__tentativa: ['resultado 5º tentativa'],
            connection_done: ['conexão realizada'],
            connection_date: ['data e hora da conexão'],
            connection_channel: ['canal da conexão'],
            "1_agendamento_de_entrevista": ['*1 agendamento de entrevista*', '1 agendamento de entrevista'],
            data_e_hora_da_entrevista___1: ['data e hora da entrevista - 1'],
            resultado_entrevista___1: ['resultado entrevista - 1'],
            "2_agendamento_de_entrevista": ['*2 agendamento de entrevista*', '2 agendamento de entrevista'],
            data_e_hora_da_entrevista___2: ['data e hora da entrevista - 2'],
            resultado_entrevista___2: ['resultado entrevista - 2'],
            "3_agendamento_de_entrevista": ['*3 agendamento de entrevista*', '3 agendamento de entrevista'],
            data_e_hora_da_entrevista___3: ['data e hora da entrevista - 3'],
            resultado_entrevista___3: ['resultado entrevista - 3'],
            "4_agendamento_de_entrevista": ['*4 agendamento de entrevista*', '4 agendamento de entrevista'],
            data_e_hora_da_entrevista___4: ['data e hora da entrevista - 4'],
            resultado_entrevista___4: ['resultado entrevista - 4'],
            tipo_de_entrevista: ['tipo de entrevista'],
            entrevista_realizada: ['*entrevista realizada*', 'entrevista realizada'],
            data_e_hora_da_entrevista_realizada: ['data e hora da entrevista realizada'],
            visita: ['*visita*', 'visita'],
            visitou_a_unidade_: ['visitou a unidade?'],
            data_e_hora_da_visita: ['data e hora da visita'],
            aula_experimental: ['*aula experimental*', 'aula experimental'],
            agendamento_aula_experimental: ['agendamento aula experimental'],
            assistiu_a_aula_experimental_: ['assistiu a aula experimental?'],
            facilitador_da_aula_experimental: ['facilitador da aula experimental'],
            cadencia_bolo: ['*cadencia bolo*', 'cadência bolo'],
            follow_up_1: ['follow up 1'],
            follow_up_2: ['follow up 2'],
            follow_up_3: ['follow up 3'],
            follow_up_4: ['follow up 4'],
            follow_up_5: ['follow up 5'],
            cadencia_negociacao: ['*cadencia negociação*', 'cadência negociação'],
            follow_up_6: ['follow up 6'],
            follow_up_7: ['follow up 7'],
            registros_de_negociacao: ['*registros de negociação*', 'registros de negociação'],
            data_e_hora_da_negociacao: ['data e hora da negociação'],
            motivo___interesse_do_lead: ['motivo - interesse do lead'],
            informacoes_sobre_pagamento: ['*informações sobre pagamento*', 'informações sobre pagamento'],
            venda_com_subsidio: ['venda com subsídio'],
            valores_de_pagamento: ['*valores de pagamento*', 'valores de pagamento'],
            tipo_de_lead: ['tipo de lead'],
            lead_veio_de_ads: ['lead veio de ads'],
            comercial: ['*comercial*', 'comercial'],
            __sdr: ['##sdr'],
            encaminhado_para_vendedor: ['encaminhado para vendedor'],
            data_encaminhado: ['data encaminhado'],
            email_comercial__contato_: ['email comercial (contato)'],
            email_pessoal__contato_: ['email pessoal (contato)'],
            outro_email__contato_: ['outro email (contato)'],
            telefone_comercial__contato_: ['telefone comercial (contato)'],
            celular__contato_: ['celular (contato)'],
            tel__direto_com___contato_: ['tel. direto com. (contato)'],
            faz__contato_: ['faz (contato)'],
            telefone_residencial__contato_: ['telefone residencial (contato)'],
            outro_telefone__contato_: ['outro telefone (contato)'],
            cpf__contato_: ['cpf (contato)'],
            data_de_nascimento__contato_: ['data de nascimento (contato)'],
            rg__contato_: ['rg (contato)'],
            nota_1: ['nota 1'],
            nota_2: ['nota 2'],
            nota_3: ['nota_3', 'nota 3'],
            nota_4: ['nota_4', 'nota 4'],
            nota_5: ['nota_5', 'nota 5'],

            follow_up_1_2: ['Follow Up 1_2', 'follow up 1 (n2)'],
            follow_up_2_2: ['Follow Up 2_2', 'follow up 2 (n2)'],
            follow_up_3_2: ['Follow Up 3_2', 'follow up 3 (n2)'],
            follow_up_4_2: ['Follow Up 4_2', 'follow up 4 (n2)'],
            follow_up_5_2: ['Follow Up 5_2', 'follow up 5 (n2)'],
            follow_up_1_3: ['Follow Up 1_3', 'follow up 1 (n3)'],
            follow_up_2_3: ['Follow Up 2_3', 'follow up 2 (n3)'],
            follow_up_3_3: ['Follow Up 3_3', 'follow up 3 (n3)'],
            follow_up_4_3: ['Follow Up 4_3', 'follow up 4 (n3)'],
            follow_up_5_3: ['Follow Up 5_3', 'follow up 5 (n3)'],
            Marketing_2: ['*Marketing_2*', 'Marketing_2', 'Marketing 2', 'marketing 2 (legado)'],

            // Extended Mapping
            updatedAt: ['última modificação'],
            nextActionAt: ['próxima tarefa'],
            lastScheduleDate: ['Data Último Agendamento']
        };

        const assignedFields = new Set();
        console.log("Iniciando mapeamento com config:", customFullMapping);

        const normalizeAggressive = (str) => String(str).toLowerCase().replace(/[^a-z0-9]/g, '').trim();

        headers.forEach(header => {
            const hRaw = String(header).trim();
            const hAggressive = normalizeAggressive(hRaw);
            // Matches "marketing2", "marketing2legado", "marketingii"
            const isMarketing2 = hAggressive.startsWith('marketing2') || hAggressive === 'marketingii';

            // 0. GLOBAL FORCE: Marketing 2 always wins regardless of custom mapping
            if (isMarketing2) {
                initialMapping[header] = 'Marketing_2';
                assignedFields.add('Marketing_2');
                console.log(`Match Forçado (Marketing 2): ${hRaw} -> Marketing_2`);
                return;
            }

            // 1. Check Custom Mapping (STRICT) - Prefer exact match of header name
            if (customFullMapping && customFullMapping[hRaw]) {
                const target = customFullMapping[hRaw];
                console.log(`Match Manual: ${hRaw} -> ${target}`);

                if (target !== 'ignore') {
                    initialMapping[header] = target;
                    assignedFields.add(target);
                    return;
                } else {
                    initialMapping[header] = 'ignore';
                    return;
                }
            }

            // 2. Auto-Guess Logic
            const h = normalize(header);

            // Pass 1: EXACT MATCH (Priority)
            let found = ALL_SYSTEM_FIELDS.find(f => {
                if (f.key === 'ignore') return false;
                if (assignedFields.has(f.key)) return false;
                const keywords = KEYWORD_ALIASES[f.key] || [f.key.toLowerCase()];
                return keywords.some(k => h === normalize(k));
            });

            // Pass 2: PARTIAL MATCH (Relaxed - Fuzzy)
            // If no exact match found, try to find if header INCLUDES keyword or Keyword INCLUDES header
            if (!found) {
                found = ALL_SYSTEM_FIELDS.find(f => {
                    if (f.key === 'ignore') return false;
                    if (assignedFields.has(f.key)) return false;
                    const keywords = KEYWORD_ALIASES[f.key] || [f.key.toLowerCase()];
                    return keywords.some(k => {
                        const kn = normalize(k);
                        // Prevent too broad matching (e.g. "id" matching "unidade") - require min length
                        if (kn.length < 3) return h === kn;
                        return h.includes(kn) || kn.includes(h);
                    });
                });
            }

            if (found) {
                console.log(`Match Automático: ${header} -> ${found.key}`);
                initialMapping[header] = found.key;
                assignedFields.add(found.key);
            }
        });

        setMapping(initialMapping);
        setStep(2);
    };



    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;

        console.log("Iniciando upload do arquivo:", uploadedFile.name);
        setFile(uploadedFile);
        const fileExt = uploadedFile.name.split('.').pop().toLowerCase();

        try {
            if (fileExt === 'csv') {
                Papa.parse(uploadedFile, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        console.log("CSV Parsed:", results);
                        if (results.errors.length) console.warn("CSV Errors:", results.errors);
                        processParsedData(results.data, results.meta.fields || []);
                    },
                    error: (err) => {
                        console.error("Erro Papa Parse:", err);
                        alert("Erro ao ler CSV: " + err.message);
                    }
                });
            } else if (['xlsx', 'xls'].includes(fileExt)) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        console.log("Arquivo lido, iniciando processamento XLSX...");
                        const bstr = evt.target.result;
                        const wb = XLSX.read(bstr, { type: 'array' });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        console.log("Planilha encontrada:", wsname);

                        // Robust Header Extraction (Array of Arrays)
                        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        if (aoa.length > 0) {
                            const rawHeaders = aoa[0];
                            console.log("Cabeçalhos brutos:", rawHeaders);

                            // Handle Duplicate Headers in XLSX
                            const headerCounts = {};
                            const headers = rawHeaders.map(h => {
                                const trimmed = String(h || '').trim(); // Safe trim
                                if (!headerCounts[trimmed]) {
                                    headerCounts[trimmed] = 1;
                                    return trimmed;
                                } else {
                                    headerCounts[trimmed]++;
                                    return `${trimmed}_${headerCounts[trimmed]}`;
                                }
                            });

                            // Re-map data using clean headers
                            const data = aoa.slice(1).map(row => {
                                const obj = {};
                                headers.forEach((h, i) => {
                                    // Use index to map value to unique header
                                    obj[h] = row[i];
                                });
                                return obj;
                            });

                            console.log("Dados processados, linhas:", data.length);
                            processParsedData(data, headers);
                        } else {
                            alert("A planilha parece estar vazia.");
                        }
                    } catch (parseError) {
                        console.error("Erro ao processar XLSX:", parseError);
                        alert("Erro ao processar o arquivo Excel: " + parseError.message);
                    }
                };
                reader.onerror = (err) => {
                    console.error("Erro FileReader:", err);
                    alert("Erro ao ler o arquivo.");
                };
                reader.readAsArrayBuffer(uploadedFile);
            } else {
                alert('Formato não suportado. Use .csv ou .xlsx');
            }
        } catch (err) {
            console.error("Erro geral upload:", err);
            alert("Erro inesperado: " + err.message);
        }
    };

    const [duplicateResolution, setDuplicateResolution] = useState(null); // { found: 0, show: false }
    const [duplicateAction, setDuplicateAction] = useState('ignore'); // 'overwrite' | 'ignore'

    const handleNextStep = () => {
        if (step === 2 && uniqueResponsibleNames.length > 0) {
            setStep(3);
            return;
        }
        handleCheckDuplicates();
    };

    const handleCheckDuplicates = async () => {
        // Validate Requirements
        const hasName = Object.values(mapping).includes('name');
        const hasPhone = Object.values(mapping).includes('phone');

        if (!hasName || !hasPhone) {
            let missing = [];
            if (!hasName) missing.push('"Nome do Contato"');
            if (!hasPhone) missing.push('"Celular / WhatsApp"');
            alert(`É obrigatório mapear as colunas: ${missing.join(' e ')}.`);
            return;
        }

        if (!targetFunnel) {
            alert('Por favor, selecione o Funil de Destino nas Configurações Globais.');
            return;
        }

        // Validate Unit Selection for Global Users
        const isGlobal = [1, 10].includes(Number(user?.roleId));
        if (isGlobal && !defaultUnitId) {
            alert('Por favor, selecione a "Unidade Padrão" para a importação.');
            return;
        }

        // Process Data Locally first to get phones
        const processedLeads = processLeadsLocally();
        if (processedLeads.length === 0) return;

        // Check Duplicates via API
        try {
            // Extract phones
            const phones = processedLeads.map(l => l.phone).filter(p => p);
            const unitToCheck = defaultUnitId || user?.unitId;

            // Mock or Real call? Assuming onImport passes an API client or we fetch directly?
            // Since this component might not have 'api' instance, we assume the parent passed 'api' or we fetch.
            // But usually we pass data to parent. 
            // Refactor: We will use the parent's `onImport` to handle the complexity OR we fetch here if we have `api`.
            // `onImport` in CRMBoard.jsx handles the POST.
            // We need to change the contract: `onImport` now accepts (leads, action, unitId) or we do the check here.
            // To keep it clean, let's do the check here if we can access API. 
            // `window.api` isn't standard. 
            // Let's pass a `checkDuplicates` prop or assume standard fetch.
            // Actually, `CRMBoard` passed `api` instance? No.
            // We'll use `onImport` as a multi-stage callback? No.

            // Simplest: `onImport` accepts a `checkMatches` mode?
            // Or simply: We calculate the processed leads, and if we are in Step 2, we advance to Step 3 (Duplicates).
            // But we need to querying BACKEND.

            // Use centralized API service
            const apiParams = {
                phones: phones,
                // Ensure we send the correct ID field for Importado deduplication
                externalIds: processedLeads.map(l => l.origin_id_importado || l.metadata?.externalId).filter(id => id),
                unitId: Number(unitToCheck || user?.unitId)
            };

            const result = await api.post('/crm/leads/import/check-duplicates', apiParams);

            // fetch response (result) is already parsed json by api.post
            // const result = await response.json();
            if (result.found > 0) {
                setDuplicateResolution({ found: result.found, duplicates: result.duplicates });
                setStep(4);
            } else {
                // No duplicates, proceed directly
                finishImport(processedLeads, 'ignore');
            }

        } catch (error) {
            console.error(error);
            alert('Erro ao verificar duplicatas. Tente novamente.');
        }
    };

    const finishImport = (leads, action) => {
        onImport(leads, action, defaultUnitId, responsibleMapping);
        onClose();
    };

    const parseImportedDate = (val) => {
        if (!val) return null;
        let iso = null;
        const v = String(val).trim();

        // Excel Serial Number (e.g., 45678 or 45678.123)
        if (!isNaN(v) && Number(v) > 20000 && Number(v) < 60000) {
            // Excel counts days from 1900-01-01 (approx)
            // Javascript uses ms from 1970-01-01
            // 25569 is the difference in days between 1900 and 1970
            const date = new Date((Number(v) - 25569) * 86400 * 1000);
            return date.toISOString();
        }

        // Formato DD.MM.YYYY HH:mm:ss (Ex: 23.12.2025 16:14:46)
        if (v.match(/^\d{2}\.\d{2}\.\d{4}\s\d{2}:\d{2}:\d{2}$/)) {
            const [date, time] = v.split(' ');
            const [d, m, y] = date.split('.');
            iso = `${y}-${m}-${d}T${time}`;
        }
        // Formato genérico com pontos
        else if (v.includes('.') && v.length > 10) {
            const parts = v.split(/[\s.]+/);
            if (parts.length >= 3) {
                iso = `${parts[2]}-${parts[1]}-${parts[0]}T${parts[3] || '00'}:${parts[4] || '00'}:${parts[5] || '00'}`;
            }
        }
        // Formato 01/01/2024
        else if (v.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            const parts = v.split(/[\/\s:]+/);
            iso = `${parts[2]}-${parts[1]}-${parts[0]}T${parts[3] || '00'}:${parts[4] || '00'}:${parts[5] || '00'}`;
        }
        // Formato 2024-01-01
        else if (v.match(/^\d{4}-\d{2}-\d{2}/)) {
            iso = v.length === 10 ? `${v}T00:00:00` : v;
        }

        if (iso) {
            const d = new Date(iso);
            return !isNaN(d.getTime()) ? d.toISOString() : null;
        }

        // Tenta o parser nativo como última opção
        const d = new Date(val);
        return !isNaN(d.getTime()) ? d.toISOString() : null;
    };

    const processLeadsLocally = () => {
        return csvData.map((row, index) => {
            const lead = {
                status: null,
                createdAt: new Date().toISOString(),
                attempts: [],
                tags: ['Importado'],
                metadata: {},
                name: '',
                phone: '',
                email: ''
            };
            let mappedFunnel = targetFunnel;

            // Apply Mapping
            // Apply Mapping (Strict Canonical Logic)
            Object.entries(mapping).forEach(([csvKey, systemKey]) => {
                let value = row[csvKey];
                if (!value) return;
                value = String(value).trim();

                if (systemKey === 'origin_id_importado') {
                    lead.origin_id_importado = value;
                    lead.metadata.externalId = value; // Backward compat
                } else if (systemKey === 'name') {
                    lead.name = value;
                } else if (systemKey === 'phone') {
                    // Limpeza de telefone aprimorada:
                    let clean = String(value).replace(/['"\s]/g, '');
                    clean = clean.replace(/\D/g, ''); // Remove não dígitos

                    const isAllZeros = /^0+$/.test(clean);
                    const isValid = clean !== '0' && clean.length >= 8 && !isAllZeros;

                    // IMPORTANTE: Só sobrescreve se o novo valor for válido.
                    // Isso evita que uma coluna de "Telefone 2" vazia apague o "Telefone 1" já lido.
                    if (isValid) {
                        lead.phone = clean;
                    }
                } else if (systemKey === 'email') {
                    // Só sobrescreve se tiver valor (mesma lógica)
                    if (value && value.includes('@')) lead.email = value;
                } else if (systemKey === 'funnel') {
                    // Normalização de Funil (Smart Mapping)
                    const f = String(value).toLowerCase();
                    if (f.includes('redes') || f.includes('social') || f.includes('instagram') || f.includes('facebook') || f.includes('midias') || f.includes('mídias') || f.includes('whats')) {
                        lead.funnel = 'social';
                    } else if (f.includes('não lead') || f.includes('not lead') || f.includes('interno') || f.includes('aluno') || f.includes('time') || f.includes('pedagógico')) {
                        lead.funnel = 'internal';
                    } else if (f.includes('vendas') || f.includes('sales') || f.includes('comercial')) {
                        lead.funnel = 'crm';
                    } else {
                        // Se não reconhecer, usa o targetFunnel selecionado ou default crm
                        lead.funnel = mappedFunnel || 'crm';
                    }
                } else if (systemKey === 'responsible') {
                    lead.responsible = value;
                } else if (systemKey === 'source') {
                    lead.source = value;
                    // Inferência de Funil por Origem
                    const s = String(value).toLowerCase();
                    if ((s.includes('instagram') || s.includes('facebook') || s.includes('whats')) && (!lead.funnel || lead.funnel === 'crm')) {
                        lead.funnel = 'social';
                    }
                } else if (systemKey === 'profession') {
                    lead.profession = value;
                } else if (systemKey === 'neighborhood') {
                    lead.neighborhood = value;
                } else if (systemKey === 'status') {
                    // Normalização ROBUSTA: Remove acentos e caracteres especiais, lower case
                    const normalizeStr = (str) => String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                    const s = normalizeStr(value);
                    console.log('DEBUG IMPORT STATUS:', value, '->', s);

                    // Mapa de Status (Normalizado -> ID do Sistema)
                    const STATUS_MAP = {
                        'novo lead': 'new', 'novo': 'new', 'entrada': 'new',
                        'conectando': 'connecting', 'tentativa': 'connecting',
                        'conexao': 'connected', 'conectado': 'connected', 'contato realizado': 'connected', 'respondido': 'connected',
                        'agendamento': 'scheduled', 'agendado': 'scheduled', 'reuniao': 'scheduled', 'visita': 'scheduled',
                        'negociacao': 'negotiation', 'proposta': 'negotiation', 'em negociacao': 'negotiation',
                        'matriculados': 'won', 'matriculado': 'won', 'venda realizada': 'won', 'ganho': 'won',
                        'atendimento encerrado': 'closed', 'encerrado': 'closed', 'perdido': 'closed', 'arquivado': 'closed',
                        'no-show': 'no_show', 'bolo': 'no_show', 'resgate': 'no_show',

                        // Social Specific
                        'novo comentario': 'social_comment', 'comentario': 'social_comment',
                        'novo direct': 'social_direct', 'direct': 'social_direct', 'mensagem': 'social_direct',
                        'instagram': 'social_comment', 'facebook': 'social_comment', 'midia': 'social_comment', 'whatsapp': 'social_comment',
                        'prospects em qualificacao': 'social_prospect', 'prospect': 'social_prospect',

                        // Internal Specific
                        'alunos': 'internal_students', 'aluno': 'internal_students',
                        'outros nao leads': 'internal_other', 'outros': 'internal_other',
                        'time interno': 'internal_team', 'time': 'internal_team'
                    };

                    // 1. Tentativa de Match Exato (Prioridade Máxima)
                    if (STATUS_MAP[s]) {
                        lead.status = STATUS_MAP[s];
                    }
                    // 2. Fallback por Palavra Chave
                    else if (s.includes('novo')) lead.status = 'new';
                    else if (s.includes('conec') && !s.includes('ao')) lead.status = 'connecting';
                    else if (s.includes('conexao') || s.includes('conectado')) lead.status = 'connected';
                    else if (s.includes('agenda')) lead.status = 'scheduled';
                    else if (s.includes('negocia')) lead.status = 'negotiation';
                    else if (s.includes('matricula')) lead.status = 'won';
                    else if (s.includes('encerra') || s.includes('perdid')) lead.status = 'closed';
                    else if (s.includes('no-show') || s.includes('bolo')) lead.status = 'no_show';

                    // Social Fallbacks
                    else if (s.includes('comentario') || s.includes('comment')) lead.status = 'social_comment';
                    else if (s.includes('direct') || s.includes('mensagem')) lead.status = 'social_direct';
                    else if (s.includes('prospect')) lead.status = 'social_prospect';

                    // Internal Fallbacks
                    else if (s.includes('aluno')) lead.status = 'internal_students';
                    else if (s.includes('outros')) lead.status = 'internal_other';
                    else if (s.includes('time') || s.includes('equipe')) lead.status = 'internal_team';

                    else lead.status = 'new'; // Default seguro

                    // INTERACTION CHECK FOR NEW LEADS
                    // Check if interactions exist in other columns (mapped implicitly)
                    const hasInteraction = Object.entries(mapping).some(([cKey, sKey]) => {
                        const val = row[cKey];
                        if (!val || String(val).trim().length === 0 || String(val).trim() === '0') return false;
                        // Check keys that imply interaction (matching our double-underscore convention)
                        return ['tentativas_de_contato', 'resultado_1__tentativa', 'resultado_2__tentativa',
                            'follow_up_1', 'follow_up_2', 'data_e_hora_da_conexao', 'cadencia_bolo', 'negociacao_1'].includes(sKey);
                    });

                    if (lead.status === 'new' && hasInteraction) {
                        lead.status = 'connecting';
                    }
                } else if (systemKey === 'observation') {
                    lead.observation = value;
                    if (value && value.trim()) {
                        try {
                            // Ensure history is an array during processing
                            let currentHistory = [];
                            if (typeof lead.history === 'string') {
                                try { currentHistory = JSON.parse(lead.history); } catch (e) { currentHistory = []; }
                            } else if (Array.isArray(lead.history)) {
                                currentHistory = lead.history;
                            }

                            currentHistory.push({
                                date: new Date().toISOString(),
                                user: 'Importação',
                                text: `Observação Importada: ${value}`
                            });
                            lead.history = JSON.stringify(currentHistory);
                        } catch (e) { console.error("History append error:", e); }
                    }
                } else if (['negociacao_1', 'negociacao_2', 'negociacao_3', 'negociacao_4', 'negociacao_5', 'Marketing_2'].includes(systemKey)) {
                    // Direct mapping for new dupe fields
                    lead[systemKey] = value;
                } else if (systemKey === 'tags') {
                    const tags = value.split(',').map(t => t.trim()).filter(t => t);
                    lead.tags = [...lead.tags, ...tags];
                } else if (systemKey === 'temperature') {
                    const t = value.toLowerCase();
                    if (['hot', 'warm', 'cold'].includes(t)) lead.temperature = t;
                    else if (t === 'quente') lead.temperature = 'hot';
                    else if (t === 'morno') lead.temperature = 'warm';
                    else if (t === 'frio') lead.temperature = 'cold';
                } else if (systemKey === 'lossReason') {
                    lead.lossReason = value;
                } else if (systemKey === 'sales_value') {
                    // Smart Money Parser
                    // Detects comma as decimal (BR) vs dot (US)
                    let clean = value.replace(/[^\d.,]/g, '');
                    if (clean.includes(',') && (!clean.includes('.') || clean.indexOf(',') > clean.indexOf('.'))) {
                        // BR Format: 1.000,00 -> 1000.00
                        clean = clean.replace(/\./g, '').replace(',', '.');
                    } else {
                        // US Format or simple Integer: 1,000.00 -> 1000.00
                        clean = clean.replace(/,/g, '');
                    }
                    lead.sales_value = parseFloat(clean) || 0;
                    lead.value = lead.sales_value;
                } else if (systemKey === 'enrollment_value') {
                    let clean = value.replace(/[^\d.,]/g, '');
                    if (clean.includes(',') && (!clean.includes('.') || clean.indexOf(',') > clean.indexOf('.'))) {
                        clean = clean.replace(/\./g, '').replace(',', '.');
                    } else {
                        clean = clean.replace(/,/g, '');
                    }
                    lead.enrollment_value = parseFloat(clean) || 0;
                } else if (systemKey === 'material_value') {
                    let clean = value.replace(/[^\d.,]/g, '');
                    if (clean.includes(',') && (!clean.includes('.') || clean.indexOf(',') > clean.indexOf('.'))) {
                        clean = clean.replace(/\./g, '').replace(',', '.');
                    } else {
                        clean = clean.replace(/,/g, '');
                    }
                    lead.material_value = parseFloat(clean) || 0;
                } else if (systemKey === 'payment_method') {
                    lead.payment_method = value;
                } else if (systemKey === 'installments') {
                    // 12x -> 12
                    const match = value.match(/\d+/);
                    lead.installments = match ? match[0] : value;
                } else if (systemKey === 'card_brand') {
                    lead.card_brand = value;
                } else if (systemKey === 'source') {
                    lead.source = value;
                } else if (systemKey === 'media') {
                    lead.media = value;
                } else if (systemKey === 'utm_source') {
                    lead.utm_source = value;
                } else if (systemKey === 'utm_medium') {
                    lead.utm_medium = value;
                } else if (systemKey === 'utm_campaign') {
                    lead.utm_campaign = value;
                } else if (systemKey === 'utm_term') {
                    lead.utm_term = value;
                } else if (systemKey === 'utm_content') {
                    lead.utm_content = value;
                } else if (systemKey === 'courseInterest') {
                    lead.courseInterest = value;
                } else if (systemKey === 'company') {
                    lead.company = value;
                } else if (systemKey === 'position') {
                    lead.position = value;
                } else if (['celular__contato_', 'telefone_comercial__contato_', 'telefone_residencial__contato_', 'outro_telefone__contato_', 'tel__direto_com___contato_'].includes(systemKey)) {
                    lead[systemKey] = value;
                } else if (systemKey === 'secondary_phone') {
                    lead.secondary_phone = value;
                } else if (systemKey === 'secondary_email') {
                    lead.secondary_email = value;
                } else if (systemKey === 'cnpj') {
                    lead.cnpj = value;
                } else if (systemKey === 'organization_id') {
                    lead.organization_id = value;
                } else if (systemKey === 'bank_code') {
                    lead.bank_code = value;
                } else if (systemKey === 'real_address') {
                    lead.real_address = value;
                } else if (systemKey === 'responsible') {
                    lead.responsible = value;
                    // FUZZY MATCH RESPONSIBLE
                    // Tenta encontrar o ID do consultor comparando nomes normalizados
                    if (consultants && consultants.length > 0) {
                        const normVal = String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                        // 1. Match Exato no Mapping
                        if (responsibleMapping && responsibleMapping[value]) {
                            lead.responsibleId = responsibleMapping[value];
                        }
                        // 2. Match Aproximado na Lista
                        else {
                            const found = consultants.find(c => {
                                const cName = String(c.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                                return cName === normVal || cName.includes(normVal) || normVal.includes(cName);
                            });
                            if (found) {
                                lead.responsibleId = found.id;
                                console.log(`✅ MATCH DONO: "${value}" -> ${found.name}`);
                            } else {
                                console.log(`❌ NO MATCH DONO: "${value}"`);
                            }
                        }
                    }
                } else if (systemKey === 'unit') {
                    lead.unit = value;
                } else if (systemKey === 'funnel') {
                    lead.funnel = value;
                } else if (systemKey === 'history_log') {
                    if (!lead.metadata.importHistory) lead.metadata.importHistory = [];
                    const logs = String(value).split(/\r?\n/).filter(l => l.trim() !== '');
                    lead.metadata.importHistory.push(...logs);
                    lead._hasInteractions = true;
                } else if (['createdAt', 'fechada_em', 'updatedAt', 'nextActionAt', 'lastScheduleDate', 'consultancyDate', 'enrollmentDate', 'data_vencimento', 'data_encaminhado', 'data_e_hora_da_negociacao', 'connection_date', 'data_e_hora_da_entrevista___1', 'data_e_hora_da_entrevista___2', 'data_e_hora_da_entrevista___3', 'data_e_hora_da_entrevista___4', 'data_e_hora_da_entrevista_realizada', 'data_e_hora_da_visita', 'agendamento_aula_experimental', 'data_de_nascimento___responsavel_financeiro', 'data_de_nascimento__contato_', 'birthDate'].includes(systemKey)) {
                    const d = parseImportedDate(value);
                    if (d) {
                        if (systemKey === 'nextActionAt') {
                            lead.nextActionAt = d;
                            lead.nextTaskDate = d;
                        } else if (systemKey === 'birthDate' || systemKey === 'data_de_nascimento__contato_') {
                            lead[systemKey] = d.split('T')[0];
                        } else {
                            lead[systemKey] = d;
                        }
                    } else {
                        lead[systemKey] = value;
                    }
                } else if (['cpf', 'cpf__contato_', 'rg', 'rg__contato_', 'cnpj', 'cpf___responsavel_financeiro', 'rg___responsavel_financeiro'].includes(systemKey)) {
                    lead[systemKey] = String(value).replace(/\D/g, '');
                } else {
                    // CATCH-ALL FOR CUSTOM FIELDS
                    lead[systemKey] = value;
                }
            });

            // AUTO-CORRECT FUNNEL BASED ON STATUS
            // Se o status for detectado como social ou interno, forçamos o funil correto
            // para evitar que o lead fique invisível no painel errado.
            if (['social_comment', 'social_direct', 'social_prospect'].includes(lead.status)) {
                lead.funnel = 'social';
            } else if (['internal_students', 'internal_other', 'internal_team'].includes(lead.status)) {
                lead.funnel = 'internal';
            }


            // COMPULSORY MATRIX SCAN (Dynamic Columns)
            Object.keys(row).forEach(header => {
                const h = String(header).trim();
                const val = String(row[header] || '').trim();
                if (!val) return;

                // Smart Name Correction (Importado Fix)
                const hLower = h.toLowerCase();
                if (hLower.includes('nome do contato') || hLower.includes('contact name')) {
                    if (!lead.name || lead.name.trim() === '' || lead.name.startsWith('Lead #') || lead.name === 'Lead Importado') {
                        lead.name = val;
                    }
                }

                const isFollowUp = h.match(/Follow Up \d+/i);
                // Extended Regex for Connection and Interview columns
                const isResult = h.match(/Resultado .* tentativa/i) || h.match(/conexão/i) || h.match(/entrevista/i) || h.match(/tipo de/i);

                if (isFollowUp || isResult) {
                    let attemptNum = 1;
                    if (isResult) {
                        const m = h.match(/(\d+)/);
                        if (m) attemptNum = parseInt(m[1]);
                    }
                    if (!lead.contactAttempts) lead.contactAttempts = [];
                    lead.contactAttempts.push({
                        notes: `${h}: ${val}`,
                        attemptNumber: attemptNum,
                        type: isFollowUp ? 'cadence' : 'attempt',
                        date: lead.createdAt || new Date()
                    });
                    lead._hasInteractions = true;
                } else if (!mapping[header]) {
                    // CATCH-ALL: No mapping exists for this header, store in extraData
                    if (!lead.metadata.extraData) lead.metadata.extraData = {};
                    lead.metadata.extraData[h] = val;
                }
            });

            // Keep notes and observation synced
            if (lead.observation && !lead.notes) lead.notes = lead.observation;
            if (lead.notes && !lead.observation) lead.observation = lead.notes;

            if (lead.tracking) lead.tracking = JSON.stringify(lead.tracking);

            if (lead.metadata.importHistory && lead.metadata.importHistory.length > 0) {
                const historyEntries = lead.metadata.importHistory.map((content, idx) => ({
                    date: lead.createdAt || new Date(Date.now() - (idx * 1000)).toISOString(),
                    actor: 'SYSTEM',
                    action: 'import_log',
                    content: content
                }));
                lead.history = JSON.stringify(historyEntries);
            }

            if (!lead.title) lead.title = lead.name ? `Negócio - ${lead.name}` : 'Lead Importado';
            if (!lead.unitId) lead.unitId = defaultUnitId || user?.unitId;
            if (!lead.unitId) {
                const u = consultants.find(c => String(c.id) === String(lead.responsibleId));
                if (u && u.unitId) lead.unitId = u.unitId;
            }
            if (!lead.unit) {
                const uObj = units.find(u => String(u.id) === String(lead.unitId));
                if (uObj) lead.unit = uObj.name;
            }
            if (!lead.responsibleId) {
                const fallbackId = defaultResponsible || user?.id;
                if (fallbackId) {
                    lead.responsibleId = fallbackId;
                    const u = consultants.find(c => String(c.id) === String(fallbackId));
                    if (u) lead.responsible = u.name;
                }
            }
            if (!lead.unitId) lead.unitId = user?.unitId || 1;

            if (!lead.status) {
                lead.status = 'new';
            }
            if (mappedFunnel === 'auto') mappedFunnel = 'crm';
            lead.funnel = mappedFunnel;

            // LÓGICA ESPECIAL: Se o lead vier como "Novo Lead" mas já tiver LOG de interações/histórico, ele pula para "Conectando"
            if (lead.status === 'new' && lead._hasInteractions) {
                lead.status = 'connecting';
            }

            // FORÇA: Se for ganho ou perdido, PRECISA estar no funil CRM (Comercial) para visibilidade
            if (lead.status === 'won' || lead.status === 'closed') {
                lead.funnel = 'crm';
            }

            // FORCE TASK CREATION: Ensure every imported lead has a next action
            if (!lead.nextTaskDate) lead.nextTaskDate = new Date().toISOString();
            if (!lead.nextTaskType) lead.nextTaskType = 'Primeiro Contato';

            if (['connecting', 'scheduled', 'negotiation', 'social_direct', 'social_prospect'].includes(lead.status) && !lead.status.startsWith('internal')) {
                if (lead.nextTaskType === 'Primeiro Contato') lead.nextTaskType = 'Acompanhamento Importado';
            }

            lead.id = `imp-${Date.now()}-${index}`; // Temp ID
            if (!lead.name) lead.name = 'Sem Nome';

            return lead;
        }).filter(l => (l.phone && l.phone.length > 5) || (l.name && l.name !== 'Sem Nome') || l.origin_id_importado);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)', zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h3>Importação de Novos Leads</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="modal-body">
                    {step === 1 ? (
                        <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
                            <Upload size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
                            <h4 style={{ margin: '0 0 8px 0', color: '#475569' }}>Faça upload da sua planilha CSV ou Excel</h4>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px' }}>São aceitos arquivos .csv, .xlsx e .xls.</p>
                            <input
                                type="file"
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileUpload}
                                style={{ display: 'block', margin: '0 auto' }}
                            />
                        </div>
                    ) : step === 3 ? (
                        <div style={{ padding: '24px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <h4 style={{ color: '#1e40af', marginBottom: '8px', fontSize: '1.2rem' }}>Revisão de Responsáveis</h4>
                                <p style={{ color: '#64748b' }}>Associe os nomes encontrados na planilha aos usuários do sistema.</p>
                            </div>

                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0', maxHeight: '400px', overflowY: 'auto' }}>
                                {uniqueResponsibleNames.map(name => (
                                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', marginBottom: '8px' }}>
                                        <div style={{ marginRight: '8px' }}>
                                            {responsibleMapping[name] ? <Check size={20} color="#16a34a" /> : <AlertCircle size={20} color="#ca8a04" />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nome na Planilha</div>
                                        </div>
                                        <ArrowRight size={16} color="#cbd5e1" />
                                        <div style={{ flex: 1.5 }}>
                                            <select
                                                className="input-field"
                                                style={{ margin: 0 }}
                                                value={responsibleMapping[name] || ''}
                                                onChange={e => setResponsibleMapping({ ...responsibleMapping, [name]: e.target.value })}
                                            >
                                                <option value="">(Ignorar / Usar Padrão)</option>
                                                {consultants.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'end', gap: '12px' }}>
                                <button className="btn-secondary" onClick={() => setStep(2)}>Voltar</button>
                                <button className="btn-primary" onClick={handleCheckDuplicates}>
                                    Confirmar e Verificar
                                </button>
                            </div>
                        </div>
                    ) : step === 4 ? (
                        <div style={{ textAlign: 'center', padding: '24px' }}>
                            <AlertCircle size={48} style={{ color: duplicateResolution?.found > 0 ? '#eab308' : '#3b82f6', marginBottom: '16px' }} />
                            <h4 style={{ fontSize: '1.2rem', color: duplicateResolution?.found > 0 ? '#854d0e' : '#1e3a8a', marginBottom: '12px' }}>
                                {duplicateResolution?.found > 0 ? `${duplicateResolution.found} Leads já existem no banco!` : 'Verificação Concluída'}
                            </h4>
                            <p style={{ color: '#475569', marginBottom: '24px' }}>
                                {duplicateResolution?.found > 0
                                    ? 'Encontramos duplicatas com base no telefone ou ID. O que deseja fazer?'
                                    : 'Nenhuma duplicata óbvia encontrada, mas você pode forçar a atualização se achar necessário.'}
                            </p>

                            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => finishImport(processLeadsLocally(), 'ignore')}
                                    style={{ borderColor: '#cbd5e1' }}
                                >
                                    Ignorar Duplicatas
                                    <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>Mantém os dados atuais do sistema</span>
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => finishImport(processLeadsLocally(), 'overwrite')}
                                    style={{ background: '#eab308', borderColor: '#eab308' }}
                                >
                                    Substituir (Atualizar)
                                    <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>Sobrescreve com dados da planilha</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ marginBottom: '24px', padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e40af' }}>Configurações Globais</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Funil de Destino</label>
                                        <select
                                            className="input-field"
                                            value={targetFunnel}
                                            onChange={e => setTargetFunnel(e.target.value)}
                                        >
                                            <option value="" disabled>Selecione o Funil...</option>
                                            <option value="auto">Detectar da Planilha (Recomendado)</option>
                                            <option value="crm">Forçar Funil Comercial</option>
                                            <option value="social">Forçar Funil Redes Sociais</option>
                                            <option value="internal">Forçar Funil Não Leads</option>
                                        </select>
                                    </div>
                                    {/* Unidade Padrão (Moved First) */}
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Unidade Padrão</label>
                                        {[1, 10].includes(Number(user?.roleId)) ? (
                                            <select
                                                className="input-field"
                                                value={defaultUnitId}
                                                onChange={e => setDefaultUnitId(e.target.value)}
                                            >
                                                <option value="">Selecione...</option>
                                                {units && units.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                className="input-field"
                                                value={user?.unit || user?.Unit?.name || 'Minha Unidade'}
                                                disabled
                                                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                                            />
                                        )}
                                    </div>

                                    {/* Responsável Padrão */}
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Responsável Padrão</label>
                                        <select
                                            className="input-field"
                                            value={defaultResponsible}
                                            onChange={e => setDefaultResponsible(e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {consultants.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* NEW: Responsible User Mapping UI */}


                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                <h4 style={{ margin: 0 }}>Mapeamento de Colunas</h4>
                                {customFullMapping && Object.keys(customFullMapping).length > 0 && (
                                    <div style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Check size={14} /> Configuração Salva Ativada
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '0 4px' }}>
                                <div style={{ flex: 1, fontWeight: 'bold', color: '#475569', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></div>
                                    Coluna da Planilha
                                </div>
                                <div style={{ width: '20px' }}></div>
                                <div style={{ flex: 1, fontWeight: 'bold', color: '#0f172a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></div>
                                    Campo no Sistema DOX
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                                {csvHeaders.map(header => (
                                    <div key={header} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ flex: 1, padding: '10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                                            {header}
                                        </div>
                                        <ArrowRight size={16} color="#94a3b8" />
                                        <div style={{ flex: 1 }}>
                                            <select
                                                className="input-field"
                                                style={{ margin: 0 }}
                                                value={mapping[header] || ''}
                                                onChange={e => setMapping({ ...mapping, [header]: e.target.value })}
                                            >
                                                <option value="">Ignorar Coluna</option>
                                                {ALL_SYSTEM_FIELDS.map(field => (
                                                    <option key={field.key} value={field.key}>
                                                        {field.label}
                                                    </option>
                                                ))}
                                                {/* The following select was malformed in the instruction and is removed.
                                                    If the intention was to provide specific options for 'source',
                                                    it should be handled conditionally within the SYSTEM_FIELDS map or as a separate mapping field. */}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'end', gap: '12px' }}>
                                <button className="btn-secondary" onClick={() => setStep(1)}>Voltar</button>
                                <button className="btn-primary" onClick={handleNextStep}>
                                    <Check size={18} /> Continuar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportLeadsModal;
