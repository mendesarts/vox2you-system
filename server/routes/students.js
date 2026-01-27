const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { Student, Unit, Class, Course } = require('../models');
const authenticate = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `students_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.xls' && ext !== '.xlsx' && ext !== '.csv') {
            return cb(new Error('Apenas arquivos Excel (.xls, .xlsx) ou CSV são permitidos'));
        }
        cb(null, true);
    }
});

// GET /api/students - List all students
router.get('/', authenticate, async (req, res) => {
    try {
        const { unitId, classId, status } = req.query;
        const where = {};

        if (unitId) where.unitId = unitId;
        if (classId) where.classId = classId;
        if (status) where.status = status;

        const students = await Student.findAll({
            where,
            include: [
                { model: Unit, attributes: ['id', 'name'] },
                {
                    model: Class,
                    attributes: ['id', 'name', 'classNumber'],
                    include: [
                        { model: Course, attributes: ['id', 'name'] }
                    ]
                }
            ],
            order: [['name', 'ASC']]
        });

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Erro ao buscar alunos' });
    }
});

// POST /api/students/import - Import students from Excel (MUST be before /:id routes!)
router.post('/import', authenticate, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const results = {
            success: 0,
            errors: [],
            total: data.length
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                // Map Excel columns to database fields
                const studentData = {
                    name: row['Nome'] || row['NOME'] || row['name'],
                    cpf: row['CPF'] || row['cpf'],
                    birthDate: row['Data de Nascimento'] || row['DATA_NASCIMENTO'] || row['birthDate'],
                    gender: row['Sexo'] || row['SEXO'] || row['gender'],
                    email: row['Email'] || row['EMAIL'] || row['email'],
                    mobile: row['Celular'] || row['CELULAR'] || row['mobile'] || row['Telefone'],
                    phone: row['Telefone Fixo'] || row['TELEFONE'] || row['phone'],
                    address: row['Endereço'] || row['ENDERECO'] || row['address'],
                    neighborhood: row['Bairro'] || row['BAIRRO'] || row['neighborhood'],
                    city: row['Cidade'] || row['CIDADE'] || row['city'],
                    cep: row['CEP'] || row['cep'],
                    responsibleName: row['Responsável'] || row['RESPONSAVEL'] || row['responsibleName'],
                    responsiblePhone: row['Telefone Responsável'] || row['TEL_RESPONSAVEL'] || row['responsiblePhone'],
                    registrationNumber: row['Matrícula'] || row['MATRICULA'] || row['registrationNumber'],
                    unitId: req.body.unitId || req.user.unitId,
                    userId: req.user.id,
                    status: 'active'
                };

                // Skip if no name
                if (!studentData.name) {
                    results.errors.push({ row: i + 1, error: 'Nome não informado' });
                    continue;
                }

                await Student.create(studentData);
                results.success++;

            } catch (error) {
                results.errors.push({
                    row: i + 1,
                    name: row['Nome'] || row['NOME'],
                    error: error.message
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json(results);

    } catch (error) {
        console.error('Error importing students:', error);
        res.status(500).json({ error: 'Erro ao importar alunos: ' + error.message });
    }
});

// POST /api/students/import/bulk - Bulk import with JSON data (from frontend modal)
router.post('/import/bulk', authenticate, async (req, res) => {
    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ error: 'Lista de alunos inválida' });
        }

        const results = {
            success: 0,
            updated: 0,
            duplicates: 0,
            errors: [],
            total: students.length
        };

        for (let i = 0; i < students.length; i++) {
            const studentData = students[i];

            try {
                // Validate required fields
                if (!studentData.name) {
                    results.errors.push({ row: i + 1, error: 'Nome é obrigatório' });
                    continue;
                }

                // Check for duplicates by CPF (if provided)
                let existingStudent = null;
                if (studentData.cpf) {
                    existingStudent = await Student.findOne({
                        where: { cpf: studentData.cpf }
                    });
                }

                // If no CPF match, try by registration number
                if (!existingStudent && studentData.registrationNumber) {
                    existingStudent = await Student.findOne({
                        where: { registrationNumber: studentData.registrationNumber }
                    });
                }

                // Prepare data for creation/update
                const dataToSave = {
                    ...studentData,
                    unitId: studentData.unitId || req.user.unitId,
                    userId: req.user.id
                };

                if (existingStudent) {
                    // Update existing student
                    await existingStudent.update(dataToSave);
                    results.updated++;
                } else {
                    // Create new student
                    await Student.create(dataToSave);
                    results.success++;
                }

            } catch (error) {
                console.error(`Error processing student ${i + 1}:`, error);
                results.errors.push({
                    row: i + 1,
                    name: studentData.name,
                    error: error.message
                });
            }
        }

        res.json(results);

    } catch (error) {
        console.error('Error in bulk import:', error);
        res.status(500).json({ error: 'Erro ao importar alunos: ' + error.message });
    }
});

// GET /api/students/:id - Get single student
router.get('/:id', authenticate, async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id, {
            include: [
                { model: Unit },
                {
                    model: Class,
                    include: [{ model: Course }]
                }
            ]
        });

        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Erro ao buscar aluno' });
    }
});

// POST /api/students - Create new student
router.post('/', authenticate, async (req, res) => {
    try {
        const student = await Student.create({
            ...req.body,
            userId: req.user.id
        });

        res.status(201).json(student);
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Erro ao criar aluno' });
    }
});

// PUT /api/students/:id - Update student
router.put('/:id', authenticate, async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);

        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        await student.update(req.body);
        res.json(student);
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Erro ao atualizar aluno' });
    }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);

        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        await student.destroy();
        res.json({ message: 'Aluno excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Erro ao excluir aluno' });
    }
});

// PUT /api/students/:id/enroll - Enroll student in a class
router.put('/:id/enroll', authenticate, async (req, res) => {
    try {
        const { classId } = req.body;
        const student = await Student.findByPk(req.params.id);

        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        await student.update({ classId });
        res.json(student);
    } catch (error) {
        console.error('Error enrolling student:', error);
        res.status(500).json({ error: 'Erro ao enturmar aluno' });
    }
});

module.exports = router;
