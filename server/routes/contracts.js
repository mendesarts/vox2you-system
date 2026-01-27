const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Unit = require('../models/Unit');
const auth = require('../middleware/auth');

/**
 * GET /api/contracts/student/:studentId
 * Gera contrato em PDF para um aluno específico
 */
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        const { studentId } = req.params;

        // Buscar dados completos do aluno
        const student = await Student.findByPk(studentId, {
            include: [
                {
                    model: Class,
                    as: 'class',
                    include: [
                        { model: Course, as: 'course' }
                    ]
                },
                {
                    model: Unit,
                    as: 'unit'
                }
            ]
        });

        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        // Preparar dados para o contrato
        const enrollmentData = {
            id: student.id,
            student: {
                name: student.name,
                cpf: student.cpf,
                rg: student.rg,
                birthDate: student.birthDate,
                address: student.address,
                neighborhood: student.neighborhood,
                city: student.city,
                state: student.state,
                cep: student.cep,
                phone: student.phone,
                email: student.email
            },
            course: student.class?.course ? {
                name: student.class.course.name,
                level: student.class.course.level,
                duration: `${student.class.course.duration} aulas`
            } : null,
            class: student.class ? {
                name: student.class.name,
                schedule: student.class.schedule,
                startDate: student.class.startDate,
                endDate: student.class.endDate
            } : null,
            unit: student.unit ? {
                name: student.unit.name,
                city: student.unit.city,
                state: student.unit.state
            } : null,
            totalValue: student.courseValue || 5000,
            installments: student.installments || 12,
            installmentValue: (student.courseValue || 5000) / (student.installments || 12),
            enrollmentValue: student.enrollmentFee || 0,
            materialValue: student.materialFee || 0,
            paymentMethod: student.paymentMethod || 'Cartão de Crédito',
            dueDay: student.paymentDueDay || 5,
            enrollmentDate: student.enrollmentDate,
            responsibleName: student.responsibleName,
            responsibleCPF: student.responsibleCPF,
            responsibleRG: student.responsibleRG
        };

        // Gerar contrato
        const result = await contractService.generateContract(enrollmentData);

        // Enviar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.pdfBuffer);

    } catch (error) {
        console.error('Erro ao gerar contrato:', error);
        res.status(500).json({
            error: 'Erro ao gerar contrato',
            details: error.message
        });
    }
});

/**
 * POST /api/contracts/generate
 * Gera contrato com dados customizados
 */
router.post('/generate', auth, async (req, res) => {
    try {
        const enrollmentData = req.body;

        // Gerar contrato
        const result = await contractService.generateContract(enrollmentData);

        // Enviar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.pdfBuffer);

    } catch (error) {
        console.error('Erro ao gerar contrato:', error);
        res.status(500).json({
            error: 'Erro ao gerar contrato',
            details: error.message
        });
    }
});

/**
 * GET /api/contracts/preview/:studentId
 * Retorna dados do contrato para preview (sem gerar PDF)
 */
router.get('/preview/:studentId', auth, async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findByPk(studentId, {
            include: [
                {
                    model: Class,
                    as: 'class',
                    include: [{ model: Course, as: 'course' }]
                },
                { model: Unit, as: 'unit' }
            ]
        });

        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        const enrollmentData = {
            id: student.id,
            student: {
                name: student.name,
                cpf: student.cpf,
                rg: student.rg,
                birthDate: student.birthDate,
                address: student.address,
                neighborhood: student.neighborhood,
                city: student.city,
                state: student.state,
                cep: student.cep,
                phone: student.phone,
                email: student.email
            },
            course: student.class?.course,
            class: student.class,
            unit: student.unit,
            totalValue: student.courseValue || 5000,
            installments: student.installments || 12,
            paymentMethod: student.paymentMethod || 'Cartão de Crédito'
        };

        const contractData = contractService.prepareContractData(enrollmentData);

        res.json({
            success: true,
            data: contractData
        });

    } catch (error) {
        console.error('Erro ao preparar preview:', error);
        res.status(500).json({
            error: 'Erro ao preparar preview',
            details: error.message
        });
    }
});

module.exports = router;
