const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: { type: DataTypes.STRING },
    source: { type: DataTypes.STRING, defaultValue: 'Organic' },
    campaign: { type: DataTypes.STRING },
    funnel: { type: DataTypes.STRING, defaultValue: 'crm' },
    status: {
        type: DataTypes.ENUM,
        values: ['new', 'connecting', 'connected', 'scheduled', 'no_show', 'negotiation', 'won', 'closed', 'lost', 'closed_won', 'closed_lost', 'archived', 'social_comment', 'social_direct', 'social_prospect', 'internal_students', 'internal_other', 'internal_team', 'nurturing'],
        defaultValue: 'new'
    },
    consultant_id: { type: DataTypes.INTEGER, allowNull: true },
    sdr_id: { type: DataTypes.INTEGER, allowNull: true },
    unitId: { type: DataTypes.INTEGER, allowNull: true },
    attemptCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastContactAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE },
    nextActionAt: { type: DataTypes.DATE },
    appointmentDate: { type: DataTypes.DATE },
    notes: { type: DataTypes.TEXT },
    history: { type: DataTypes.TEXT, defaultValue: '[]' },
    quantity: { type: DataTypes.INTEGER },
    company: { type: DataTypes.STRING },
    secondary_phone: { type: DataTypes.STRING },
    secondary_email: { type: DataTypes.STRING },
    position: { type: DataTypes.STRING },
    city: { type: DataTypes.STRING },
    neighborhood: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    state: { type: DataTypes.STRING },
    cep: { type: DataTypes.STRING },
    cnpj: { type: DataTypes.STRING },
    cpf: { type: DataTypes.STRING },
    rg: { type: DataTypes.STRING },
    birthDate: { type: DataTypes.DATEONLY },
    tags: { type: DataTypes.TEXT },
    temperature: {
        type: DataTypes.ENUM('hot', 'warm', 'cold'),
        defaultValue: 'cold'
    },
    courseInterest: { type: DataTypes.STRING },
    lossReason: { type: DataTypes.STRING },
    origin_id_importado: { type: DataTypes.STRING, unique: true },
    sales_value: { type: DataTypes.FLOAT },
    enrollment_value: { type: DataTypes.FLOAT },
    material_value: { type: DataTypes.FLOAT },
    payment_method: { type: DataTypes.STRING },
    observation: { type: DataTypes.TEXT },
    installments: { type: DataTypes.STRING },
    card_brand: { type: DataTypes.STRING },
    media: { type: DataTypes.STRING },
    connection_done: { type: DataTypes.BOOLEAN, defaultValue: false },
    connection_date: { type: DataTypes.DATE },
    connection_channel: { type: DataTypes.STRING },
    utm_source: { type: DataTypes.STRING },
    utm_medium: { type: DataTypes.STRING },
    utm_campaign: { type: DataTypes.STRING },
    utm_term: { type: DataTypes.STRING },
    utm_content: { type: DataTypes.STRING },
    metadata: { type: DataTypes.TEXT, defaultValue: '{}' },
    adData: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const val = this.getDataValue('adData');
            return val ? JSON.parse(val) : {};
        },
        set(value) {
            this.setDataValue('adData', JSON.stringify(value));
        }
    },

    // Custom Fields from Manual Mapping
    venda: { type: DataTypes.STRING },
    criado_por: { type: DataTypes.STRING },
    modificado_por: { type: DataTypes.STRING },
    fechada_em: { type: DataTypes.STRING },
    sobre_o_lead: { type: DataTypes.TEXT },
    marketing: { type: DataTypes.TEXT },
    insucesso: { type: DataTypes.TEXT },
    tentativas_de_contato: { type: DataTypes.TEXT },
    resultado_1__tentativa: { type: DataTypes.STRING },
    resultado_2__tentativa: { type: DataTypes.STRING },
    resultado_3__tentativa: { type: DataTypes.STRING },
    resultado_4__tentativa: { type: DataTypes.STRING },
    resultado_5__tentativa: { type: DataTypes.STRING },
    "1_agendamento_de_entrevista": { type: DataTypes.STRING },
    data_e_hora_da_entrevista___1: { type: DataTypes.STRING },
    resultado_entrevista___1: { type: DataTypes.STRING },
    "2_agendamento_de_entrevista": { type: DataTypes.STRING },
    data_e_hora_da_entrevista___2: { type: DataTypes.STRING },
    resultado_entrevista___2: { type: DataTypes.STRING },
    "3_agendamento_de_entrevista": { type: DataTypes.STRING },
    data_e_hora_da_entrevista___3: { type: DataTypes.STRING },
    resultado_entrevista___3: { type: DataTypes.STRING },
    "4_agendamento_de_entrevista": { type: DataTypes.STRING },
    data_e_hora_da_entrevista___4: { type: DataTypes.STRING },
    resultado_entrevista___4: { type: DataTypes.STRING },
    tipo_de_entrevista: { type: DataTypes.STRING },
    entrevista_realizada: { type: DataTypes.STRING },
    data_e_hora_da_entrevista_realizada: { type: DataTypes.STRING },
    visita: { type: DataTypes.STRING },
    visitou_a_unidade_: { type: DataTypes.STRING },
    data_e_hora_da_visita: { type: DataTypes.STRING },
    aula_experimental: { type: DataTypes.STRING },
    agendamento_aula_experimental: { type: DataTypes.STRING },
    assistiu_a_aula_experimental_: { type: DataTypes.STRING },
    facilitador_da_aula_experimental: { type: DataTypes.STRING },
    cadencia_bolo: { type: DataTypes.TEXT },
    follow_up_1: { type: DataTypes.TEXT },
    follow_up_2: { type: DataTypes.TEXT },
    follow_up_3: { type: DataTypes.TEXT },
    follow_up_4: { type: DataTypes.TEXT },
    follow_up_5: { type: DataTypes.TEXT },
    cadencia_negociacao: { type: DataTypes.TEXT },
    follow_up_6: { type: DataTypes.TEXT },
    follow_up_7: { type: DataTypes.TEXT },
    registros_de_negociacao: { type: DataTypes.TEXT },
    data_e_hora_da_negociacao: { type: DataTypes.STRING },
    motivo___interesse_do_lead: { type: DataTypes.TEXT },
    informacoes_sobre_pagamento: { type: DataTypes.TEXT },
    qtd__de_parcela__cartao_de_credito_: { type: DataTypes.STRING },
    bandeira__cartao_de_credito_: { type: DataTypes.STRING },
    venda_com_subsidio: { type: DataTypes.STRING },
    valores_de_pagamento: { type: DataTypes.TEXT },
    valor_material_didatico: { type: DataTypes.STRING },
    tipo_de_lead: { type: DataTypes.STRING },
    lead_veio_de_ads: { type: DataTypes.STRING },
    comercial: { type: DataTypes.TEXT },
    __sdr: { type: DataTypes.STRING },
    encaminhado_para_vendedor: { type: DataTypes.STRING },
    data_encaminhado: { type: DataTypes.STRING },
    utm_referrer: { type: DataTypes.STRING },
    referrer: { type: DataTypes.STRING },
    gclientid: { type: DataTypes.STRING },
    gclid: { type: DataTypes.STRING },
    posicao__contato_: { type: DataTypes.STRING },
    fbclid: { type: DataTypes.STRING },
    email_comercial__contato_: { type: DataTypes.STRING },
    email_pessoal__contato_: { type: DataTypes.STRING },
    outro_email__contato_: { type: DataTypes.STRING },
    telefone_comercial__contato_: { type: DataTypes.STRING },
    celular__contato_: { type: DataTypes.STRING },
    tel__direto_com___contato_: { type: DataTypes.STRING },
    faz__contato_: { type: DataTypes.STRING },
    telefone_residencial__contato_: { type: DataTypes.STRING },
    outro_telefone__contato_: { type: DataTypes.STRING },
    cpf__contato_: { type: DataTypes.STRING },
    data_de_nascimento__contato_: { type: DataTypes.STRING },
    endereco__contato_: { type: DataTypes.STRING },
    rg__contato_: { type: DataTypes.STRING },
    nota_2: { type: DataTypes.TEXT },
    nota_1: { type: DataTypes.TEXT },
    nota_3: { type: DataTypes.TEXT },
    nota_4: { type: DataTypes.TEXT },
    nota_5: { type: DataTypes.TEXT },
    negociacao_1: { type: DataTypes.TEXT },
    negociacao_2: { type: DataTypes.TEXT },
    negociacao_3: { type: DataTypes.TEXT },
    negociacao_4: { type: DataTypes.TEXT },
    negociacao_5: { type: DataTypes.TEXT },

    // Additional Follow-ups for Negotiation (Importado specific)
    follow_up_1_2: { type: DataTypes.TEXT },
    follow_up_2_2: { type: DataTypes.TEXT },
    follow_up_3_2: { type: DataTypes.TEXT },
    follow_up_4_2: { type: DataTypes.TEXT },
    follow_up_5_2: { type: DataTypes.TEXT },
    follow_up_1_3: { type: DataTypes.TEXT },
    follow_up_2_3: { type: DataTypes.TEXT },
    follow_up_3_3: { type: DataTypes.TEXT },
    follow_up_4_3: { type: DataTypes.TEXT },
    follow_up_5_3: { type: DataTypes.TEXT },

    Marketing_2: { type: DataTypes.TEXT },

    // Missing Fields for full Importado support
    data_vencimento: { type: DataTypes.STRING },
    real_address: { type: DataTypes.STRING },
    consultancyDate: { type: DataTypes.STRING },
    enrollmentDate: { type: DataTypes.STRING },
    organization_id: { type: DataTypes.STRING },
    bank_code: { type: DataTypes.STRING },
    lastScheduleDate: { type: DataTypes.STRING },

    // Responsible Financeiro
    responsibleName: { type: DataTypes.STRING },
    cpf___responsavel_financeiro: { type: DataTypes.STRING },
    rg___responsavel_financeiro: { type: DataTypes.STRING },
    data_de_nascimento___responsavel_financeiro: { type: DataTypes.STRING },
    email___responsavel_financeiro: { type: DataTypes.STRING },
    telefone___responsavel_financeiro: { type: DataTypes.STRING }
}, {
    hooks: {
        beforeDestroy: async (lead, options) => {
            // Dynamically require models to ensure everything is loaded, 
            // but usually in Sequelize hooks the models are attached to the instance or sequelize object.
            // Using sequelize.models is safer if available.
            try {
                const { Task, CadenceLog, ContactAttempt } = sequelize.models; // Access loaded models from sequelize instance

                if (Task) {
                    await Task.destroy({ where: { leadId: lead.id }, transaction: options.transaction });
                }
                if (CadenceLog) {
                    await CadenceLog.destroy({ where: { leadId: lead.id }, transaction: options.transaction });
                }
                if (ContactAttempt) {
                    await ContactAttempt.destroy({ where: { leadId: lead.id }, transaction: options.transaction });
                }
            } catch (error) {
                console.error('Error cleaning up lead associations:', error);
            }
        }
    }
});

Lead.associate = (models) => {
    Lead.belongsTo(models.User, { foreignKey: 'consultant_id', as: 'consultant' });
    Lead.belongsTo(models.Unit, { foreignKey: 'unitId', as: 'unit' });
    Lead.hasMany(models.Task, { foreignKey: 'leadId', as: 'tasks' });
    Lead.hasOne(models.Student, { foreignKey: 'leadId', as: 'student' });
    Lead.hasMany(models.CadenceLog, { foreignKey: 'leadId', as: 'cadenceLogs' });
    Lead.hasMany(models.ContactAttempt, { foreignKey: 'leadId', as: 'contactAttempts' });
};

module.exports = Lead;
