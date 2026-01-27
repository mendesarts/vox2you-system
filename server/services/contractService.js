const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');
const PDFDocument = require('pdfkit');

class ContractService {
    constructor() {
        this.contractTemplatePath = path.join(__dirname, '..', 'CONTRATO_DE_PRESTACAO_DE_SERVICOS_-_ACADEMY_23.docx');
    }

    /**
     * Gera um contrato em PDF preenchido com os dados do aluno
     */
    async generateContract(enrollmentData) {
        try {
            // Ler o template DOCX
            const buffer = await fs.readFile(this.contractTemplatePath);
            const result = await mammoth.extractRawText({ buffer });
            let contractText = result.value;

            // Preparar dados do aluno
            const data = this.prepareContractData(enrollmentData);

            // Substituir placeholders no texto
            contractText = this.fillTemplate(contractText, data);

            // Gerar PDF
            const pdfBuffer = await this.generatePDF(contractText, data);

            return {
                success: true,
                pdfBuffer,
                filename: `Contrato_${data.studentName.replace(/\s/g, '_')}_${Date.now()}.pdf`
            };
        } catch (error) {
            console.error('Erro ao gerar contrato:', error);
            throw error;
        }
    }

    /**
     * Prepara os dados do contrato a partir dos dados de matrícula
     */
    prepareContractData(enrollment) {
        const today = new Date();
        const formatDate = (date) => {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleDateString('pt-BR');
        };

        return {
            // Dados do aluno (CONTRATANTE)
            studentName: enrollment.student?.name || enrollment.name || '',
            studentCPF: enrollment.student?.cpf || enrollment.cpf || '',
            studentRG: enrollment.student?.rg || enrollment.rg || '',
            studentAddress: enrollment.student?.address || enrollment.address || '',
            studentNeighborhood: enrollment.student?.neighborhood || enrollment.neighborhood || '',
            studentCity: enrollment.student?.city || enrollment.city || 'Brasília',
            studentState: enrollment.student?.state || enrollment.state || 'DF',
            studentCEP: enrollment.student?.cep || enrollment.cep || '',
            studentPhone: enrollment.student?.phone || enrollment.phone || '',
            studentEmail: enrollment.student?.email || enrollment.email || '',
            studentBirthDate: formatDate(enrollment.student?.birthDate || enrollment.birthDate),

            // Dados do curso
            courseName: enrollment.course?.name || enrollment.courseName || 'Master 3.0',
            className: enrollment.class?.name || enrollment.className || '',
            courseLevel: enrollment.course?.level || enrollment.level || 'Avançado',
            courseDuration: enrollment.course?.duration || enrollment.duration || '48 aulas',
            classSchedule: enrollment.class?.schedule || enrollment.schedule || '',
            startDate: formatDate(enrollment.class?.startDate || enrollment.startDate),
            endDate: formatDate(enrollment.class?.endDate || enrollment.endDate),

            // Dados financeiros
            totalValue: this.formatCurrency(enrollment.totalValue || enrollment.value || 5000),
            installments: enrollment.installments || 12,
            installmentValue: this.formatCurrency(enrollment.installmentValue || (enrollment.totalValue || 5000) / (enrollment.installments || 12)),
            enrollmentValue: this.formatCurrency(enrollment.enrollmentValue || 0),
            materialValue: this.formatCurrency(enrollment.materialValue || 0),
            paymentMethod: enrollment.paymentMethod || 'Cartão de Crédito',
            dueDay: enrollment.dueDay || 5,

            // Dados da unidade (CONTRATADA)
            unitName: enrollment.unit?.name || enrollment.unitName || 'Vox2You Academy',
            unitCNPJ: '00.000.000/0001-00',
            unitAddress: 'Endereço da Unidade',
            unitCity: enrollment.unit?.city || 'Brasília',
            unitState: enrollment.unit?.state || 'DF',
            unitPhone: '(61) 99999-9999',
            unitEmail: 'contato@vox2you.com.br',

            // Dados do contrato
            contractDate: formatDate(today),
            contractNumber: `VOX-${today.getFullYear()}-${String(enrollment.id || Math.floor(Math.random() * 10000)).padStart(5, '0')}`,

            // Responsável financeiro (se diferente do aluno)
            responsibleName: enrollment.responsibleName || '',
            responsibleCPF: enrollment.responsibleCPF || '',
            responsibleRG: enrollment.responsibleRG || '',
            responsibleRelation: enrollment.responsibleRelation || ''
        };
    }

    /**
     * Preenche o template com os dados
     */
    fillTemplate(text, data) {
        let filled = text;

        // Substituir todos os campos
        Object.keys(data).forEach(key => {
            const placeholder = new RegExp(`\\[${key}\\]`, 'gi');
            filled = filled.replace(placeholder, data[key] || '_______________');
        });

        // Substituir placeholders comuns do template original
        const replacements = {
            'CONTRATANTE': data.studentName,
            'CPF': data.studentCPF,
            'RG': data.studentRG,
            'ENDEREÇO': `${data.studentAddress}, ${data.studentNeighborhood}, ${data.studentCity}/${data.studentState}, CEP: ${data.studentCEP}`,
            'CURSO': data.courseName,
            'VALOR TOTAL': data.totalValue,
            'PARCELAS': `${data.installments}x de ${data.installmentValue}`,
            'DATA': data.contractDate
        };

        Object.keys(replacements).forEach(key => {
            const regex = new RegExp(key, 'g');
            filled = filled.replace(regex, replacements[key]);
        });

        return filled;
    }

    /**
     * Gera o PDF a partir do texto preenchido
     */
    async generatePDF(text, data) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Cabeçalho
                doc.fontSize(16).font('Helvetica-Bold').text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS', {
                    align: 'center'
                });
                doc.moveDown();

                doc.fontSize(10).font('Helvetica').text(`Contrato Nº: ${data.contractNumber}`, {
                    align: 'right'
                });
                doc.text(`Data: ${data.contractDate}`, {
                    align: 'right'
                });
                doc.moveDown(2);

                // Partes do contrato
                doc.fontSize(12).font('Helvetica-Bold').text('CONTRATADA:', { continued: false });
                doc.fontSize(10).font('Helvetica')
                    .text(`${data.unitName}`)
                    .text(`CNPJ: ${data.unitCNPJ}`)
                    .text(`Endereço: ${data.unitAddress}, ${data.unitCity}/${data.unitState}`)
                    .text(`Telefone: ${data.unitPhone}`)
                    .text(`E-mail: ${data.unitEmail}`);
                doc.moveDown();

                doc.fontSize(12).font('Helvetica-Bold').text('CONTRATANTE:', { continued: false });
                doc.fontSize(10).font('Helvetica')
                    .text(`Nome: ${data.studentName}`)
                    .text(`CPF: ${data.studentCPF}`)
                    .text(`RG: ${data.studentRG}`)
                    .text(`Data de Nascimento: ${data.studentBirthDate}`)
                    .text(`Endereço: ${data.studentAddress}, ${data.studentNeighborhood}`)
                    .text(`${data.studentCity}/${data.studentState} - CEP: ${data.studentCEP}`)
                    .text(`Telefone: ${data.studentPhone}`)
                    .text(`E-mail: ${data.studentEmail}`);
                doc.moveDown(2);

                // Objeto do contrato
                doc.fontSize(12).font('Helvetica-Bold').text('DO OBJETO', { continued: false });
                doc.fontSize(10).font('Helvetica')
                    .text(`O presente contrato tem por objeto a prestação de serviços educacionais referente ao curso "${data.courseName}", nível ${data.courseLevel}, com duração de ${data.courseDuration}.`, {
                        align: 'justify'
                    });
                doc.moveDown();

                doc.text(`Turma: ${data.className}`, { align: 'justify' });
                doc.text(`Horário: ${data.classSchedule}`, { align: 'justify' });
                doc.text(`Período: ${data.startDate} a ${data.endDate}`, { align: 'justify' });
                doc.moveDown(2);

                // Valor e forma de pagamento
                doc.fontSize(12).font('Helvetica-Bold').text('DO VALOR E FORMA DE PAGAMENTO', { continued: false });
                doc.fontSize(10).font('Helvetica')
                    .text(`Valor Total do Curso: ${data.totalValue}`, { align: 'justify' })
                    .text(`Forma de Pagamento: ${data.paymentMethod}`, { align: 'justify' })
                    .text(`Parcelamento: ${data.installments}x de ${data.installmentValue}`, { align: 'justify' })
                    .text(`Vencimento: Todo dia ${data.dueDay} de cada mês`, { align: 'justify' });

                if (data.enrollmentValue && parseFloat(data.enrollmentValue.replace(/[^\d,]/g, '').replace(',', '.')) > 0) {
                    doc.text(`Taxa de Matrícula: ${data.enrollmentValue}`, { align: 'justify' });
                }
                if (data.materialValue && parseFloat(data.materialValue.replace(/[^\d,]/g, '').replace(',', '.')) > 0) {
                    doc.text(`Material Didático: ${data.materialValue}`, { align: 'justify' });
                }
                doc.moveDown(2);

                // Cláusulas principais
                const clauses = [
                    {
                        title: 'DAS OBRIGAÇÕES DA CONTRATADA',
                        text: 'A CONTRATADA se obriga a ministrar as aulas conforme cronograma estabelecido, fornecer material didático adequado, manter professores qualificados e oferecer suporte pedagógico ao aluno.'
                    },
                    {
                        title: 'DAS OBRIGAÇÕES DO CONTRATANTE',
                        text: 'O CONTRATANTE se obriga a frequentar regularmente as aulas, realizar o pagamento das mensalidades nas datas estabelecidas, zelar pelo material didático fornecido e respeitar as normas internas da instituição.'
                    },
                    {
                        title: 'DA FREQUÊNCIA',
                        text: 'É obrigatória a frequência mínima de 75% das aulas para conclusão do curso. O aluno que não atingir esta frequência não receberá certificado de conclusão.'
                    },
                    {
                        title: 'DO CANCELAMENTO',
                        text: 'O cancelamento do contrato poderá ser solicitado por qualquer das partes mediante comunicação por escrito com 30 dias de antecedência. Em caso de cancelamento pelo CONTRATANTE, não haverá devolução dos valores já pagos.'
                    },
                    {
                        title: 'DAS DISPOSIÇÕES GERAIS',
                        text: 'Este contrato é regido pelas leis brasileiras. Qualquer alteração deverá ser feita por escrito e assinada por ambas as partes. As partes elegem o foro da comarca de Brasília/DF para dirimir quaisquer questões oriundas deste contrato.'
                    }
                ];

                clauses.forEach((clause, index) => {
                    if (doc.y > 650) {
                        doc.addPage();
                    }
                    doc.fontSize(12).font('Helvetica-Bold').text(clause.title, { continued: false });
                    doc.fontSize(10).font('Helvetica').text(clause.text, { align: 'justify' });
                    doc.moveDown();
                });

                // Assinaturas
                if (doc.y > 600) {
                    doc.addPage();
                }
                doc.moveDown(3);
                doc.fontSize(10).font('Helvetica').text(`${data.unitCity}/${data.unitState}, ${data.contractDate}`, {
                    align: 'center'
                });
                doc.moveDown(4);

                // Linha de assinatura CONTRATADA
                doc.text('_'.repeat(50), { align: 'center' });
                doc.fontSize(9).text(data.unitName, { align: 'center' });
                doc.text('CONTRATADA', { align: 'center' });
                doc.moveDown(3);

                // Linha de assinatura CONTRATANTE
                doc.text('_'.repeat(50), { align: 'center' });
                doc.fontSize(9).text(data.studentName, { align: 'center' });
                doc.text(`CPF: ${data.studentCPF}`, { align: 'center' });
                doc.text('CONTRATANTE', { align: 'center' });

                // Se houver responsável financeiro
                if (data.responsibleName) {
                    doc.moveDown(3);
                    doc.text('_'.repeat(50), { align: 'center' });
                    doc.fontSize(9).text(data.responsibleName, { align: 'center' });
                    doc.text(`CPF: ${data.responsibleCPF}`, { align: 'center' });
                    doc.text('RESPONSÁVEL FINANCEIRO', { align: 'center' });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Formata valor monetário
     */
    formatCurrency(value) {
        if (!value) return 'R$ 0,00';
        const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) : value;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(num || 0);
    }
}

module.exports = new ContractService();
