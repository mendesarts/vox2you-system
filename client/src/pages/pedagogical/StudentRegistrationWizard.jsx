import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { validateCPF, formatCPF, validatePhone, formatPhone, validateCEP, formatCEP, fetchAddressByCEP } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';

const CurrencyInput = ({ value, onChange, placeholder, className }) => {
    const handleChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (!val) {
            onChange('');
            return;
        }
        val = (parseInt(val) / 100).toFixed(2);
        onChange(val);
    };

    const formatDisplay = (val) => {
        if (!val) return '';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <input
            type="text"
            className={className}
            value={formatDisplay(value)}
            onChange={handleChange}
            placeholder={placeholder}
        />
    );
};

const paymentOptions = [
    { value: 'pix', label: 'Pix' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'credit', label: 'Cartão Crédito' },
    { value: 'debit', label: 'Cartão Débito' },
    { value: 'money', label: 'Dinheiro' },
    { value: 'recurrence', label: 'Recorrência' },
    { value: 'cheque', label: 'Cheque' }
];

const StudentRegistrationWizard = ({ onClose, onSave, classes = [], initialData = null }) => {
    const isEdit = !!initialData;
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);

    // Standard UI Colors
    const COLORS = {
        primary: 'var(--ios-teal)',
        success: '#34C759',
        bg: 'var(--ios-bg)',
        text: 'var(--ios-text)',
        border: 'rgba(0,0,0,0.1)'
    };

    // Form States
    const [studentData, setStudentData] = useState({
        name: initialData?.name || '',
        gender: initialData?.gender || '',
        birthDate: initialData?.birthDate ? initialData.birthDate.split('T')[0] : (initialData?.data_de_nascimento___responsavel_financeiro || ''),
        profession: initialData?.profession || initialData?.profissão || initialData?.posicao__contato_ || '',
        workplace: initialData?.workplace || initialData?.company || '',
        cpf: initialData?.cpf || initialData?.cpf__contato_ || initialData?.cpf___responsavel_financeiro || '',
        cep: initialData?.cep || '',
        address: initialData?.address || initialData?.real_address || '',
        neighborhood: initialData?.neighborhood || '',
        city: initialData?.city || '',
        mobile: initialData?.mobile || initialData?.phone || initialData?.telefone___responsavel_financeiro || '',
        phone: initialData?.phone || '',
        email: initialData?.email || initialData?.email___responsavel_financeiro || '',
        responsibleName: initialData?.responsibleName || initialData?.responsibleName || '',
        responsiblePhone: initialData?.responsiblePhone || initialData?.telefone___responsavel_financeiro || ''
    });

    const [enrollmentData, setEnrollmentData] = useState({
        classId: initialData?.classId || '',
        courseId: initialData?.courseId || ''
    });

    const [financialData, setFinancialData] = useState({
        enrollmentFee: {
            amount: initialData?.enrollment_value || '',
            dueDate: initialData?.data_vencimento || '',
            method: initialData?.payment_method?.toLowerCase() || 'pix',
            installments: 1,
            isPaid: false
        },
        courseFee: {
            amount: initialData?.sales_value || initialData?.venda || '',
            dueDate: initialData?.data_vencimento || '',
            method: initialData?.payment_method?.toLowerCase() || 'boleto',
            installments: initialData?.installments || initialData?.qtd__de_parcela__cartao_de_credito_ || 1,
            isPaid: false
        },
        materialFee: {
            amount: initialData?.material_value || initialData?.valor_material_didatico || '',
            dueDate: initialData?.data_vencimento || '',
            method: initialData?.payment_method?.toLowerCase() || 'credit',
            installments: 1,
            isPaid: false,
            source: 'stock'
        },
        contractSigned: false
    });

    const [isMinor, setIsMinor] = useState(false);

    // Effect to check age
    useEffect(() => {
        if (studentData.birthDate) {
            const birth = new Date(studentData.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            setIsMinor(age < 18);
        }
    }, [studentData.birthDate]);

    const handleStudentChange = (e) => {
        let { name, value } = e.target;

        // Auto-format fields
        if (name === 'cpf') value = formatCPF(value);
        if (name === 'mobile' || name === 'phone' || name === 'responsiblePhone') value = formatPhone(value);
        if (name === 'cep') value = formatCEP(value);

        setStudentData(prev => ({ ...prev, [name]: value }));
    };

    const handleCepBlur = async () => {
        if (validateCEP(studentData.cep)) {
            setLoadingCep(true);
            const address = await fetchAddressByCEP(studentData.cep);
            setLoadingCep(false);
            if (address) {
                setStudentData(prev => ({
                    ...prev,
                    address: address.address,
                    neighborhood: address.neighborhood,
                    city: address.city
                }));
            }
        }
    };

    const handleFinancialChange = (type, field, value) => {
        // Validation for installments (negative numbers)
        if (field === 'installments' && value < 1) value = 1;

        setFinancialData(prev => ({
            ...prev,
            [type]: { ...prev[type], [field]: value }
        }));
    };

    // Validation & Next Step
    const nextStep = () => {
        if (step === 1) {
            if (!studentData.name || !studentData.mobile || !studentData.cpf || !studentData.email) {
                alert('Nome, Celular, CPF e Email são obrigatórios.');
                return;
            }
            if (!validateCPF(studentData.cpf)) {
                alert('CPF inválido.');
                return;
            }
            if (!validatePhone(studentData.mobile)) {
                alert('Celular inválido (mínimo 10 dígitos).');
                return;
            }
            if (isMinor && !studentData.responsibleName) {
                alert('Nome do Responsável é obrigatório para menores.');
                return;
            }
        }
        if (step === 2) {
            if (!enrollmentData.classId) {
                alert('Selecione uma turma.');
                return;
            }
            // Capacity Check - Use == for ID comparison
            const selectedClass = classes.find(c => String(c.id) === String(enrollmentData.classId));
            if (selectedClass) {
                const currentCount = (selectedClass.Students || selectedClass.students || selectedClass.Enrollments || selectedClass.enrollments || []).length;
                if (currentCount >= selectedClass.capacity) {
                    if (!window.confirm(`A turma ${selectedClass.name} está cheia (${currentCount}/${selectedClass.capacity}). Deseja continuar mesmo assim?`)) {
                        return;
                    }
                }
            }
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            // 1. Create or Update Student
            const studentPayload = {
                ...studentData,
                contractStatus: financialData.contractSigned ? 'signed' : 'pending',
                unit: user?.unit
            };
            const token = localStorage.getItem('token');
            const url = isEdit
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students/${initialData.id}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students`;

            const resStudent = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(studentPayload)
            });
            if (!resStudent.ok) {
                const errData = await resStudent.json();
                throw new Error(errData.error || 'Erro ao salvar aluno');
            }
            const savedStudent = await resStudent.json();

            // 2. Create Enrollment
            // Use == for ID comparison
            const selectedClass = classes.find(c => String(c.id) == String(enrollmentData.classId));

            const enrollmentPayload = {
                studentId: savedStudent.id,
                classId: enrollmentData.classId,
                courseId: selectedClass?.courseId
            };

            const resEnrollment = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/enrollments`, { // Need to create this route
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(enrollmentPayload)
            });
            if (!resEnrollment.ok) {
                const errData = await resEnrollment.json();
                throw new Error(errData.error || 'Erro ao matricular');
            }
            const createdEnrollment = await resEnrollment.json();

            // 3. Create Financial Records (Batch)
            const financialPayload = {
                enrollmentId: createdEnrollment.id,
                studentId: savedStudent.id,
                fees: financialData
            };

            const resFinancial = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/batch`, { // Need to create this route
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(financialPayload)
            });
            if (!resFinancial.ok) {
                const errData = await resFinancial.json();
                throw new Error(errData.error || 'Erro ao gerar financeiro');
            }

            onSave();
            onClose();

        } catch (error) {
            alert(error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h3>{isEdit ? 'Editar Matrícula' : 'Nova Matrícula'} - Passo {step}/3</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ padding: '20px' }}>

                    {/* STEP 1: DADOS PESSOAIS */}
                    {step === 1 && (
                        <div className="form-grid">
                            <h4 style={{ gridColumn: '1/-1', marginBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', color: 'var(--ios-teal)', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}>Dados Pessoais</h4>

                            <div className="form-group">
                                <label>Nome Completo *</label>
                                <input name="name" value={studentData.name} onChange={handleStudentChange} className="input-field" required />
                            </div>
                            <div className="form-group">
                                <label>Gênero</label>
                                <select name="gender" value={studentData.gender} onChange={handleStudentChange} className="input-field">
                                    <option value="">Selecione...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Feminino</option>
                                    <option value="O">Outro</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Data de Nascimento</label>
                                <input type="date" name="birthDate" value={studentData.birthDate} onChange={handleStudentChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>CPF *</label>
                                <input name="cpf" value={studentData.cpf} onChange={handleStudentChange} className="input-field" placeholder="000.000.000-00" maxLength={14} required />
                            </div>

                            <div className="form-group">
                                <label>Profissão</label>
                                <input name="profession" value={studentData.profession} onChange={handleStudentChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>Empresa / Local de Trabalho</label>
                                <input name="workplace" value={studentData.workplace} onChange={handleStudentChange} className="input-field" />
                            </div>

                            <h4 style={{ gridColumn: '1/-1', marginTop: '20px', marginBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', color: 'var(--ios-teal)', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}>Endereço e Contato</h4>

                            <div className="form-group">
                                <label>CEP {loadingCep && <span className="text-muted text-sm">(Buscando...)</span>}</label>
                                <input name="cep" value={studentData.cep} onChange={handleStudentChange} onBlur={handleCepBlur} className="input-field" placeholder="00000-000" maxLength={9} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Endereço</label>
                                <input name="address" value={studentData.address} onChange={handleStudentChange} className="input-field" disabled={loadingCep} />
                            </div>
                            <div className="form-group">
                                <label>Bairro</label>
                                <input name="neighborhood" value={studentData.neighborhood} onChange={handleStudentChange} className="input-field" disabled={loadingCep} />
                            </div>
                            <div className="form-group">
                                <label>Cidade</label>
                                <input name="city" value={studentData.city} onChange={handleStudentChange} className="input-field" disabled={loadingCep} />
                            </div>
                            <div className="form-group">
                                <label>Celular (WhatsApp) *</label>
                                <input name="mobile" value={studentData.mobile} onChange={handleStudentChange} className="input-field" placeholder="(00) 00000-0000" maxLength={15} required />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input name="email" value={studentData.email} onChange={handleStudentChange} className="input-field" type="email" required />
                            </div>

                            {isMinor && (
                                <>
                                    <h4 style={{ gridColumn: '1/-1', marginTop: '20px', marginBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', color: 'var(--ios-teal)', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}>Dados do Responsável (Menor de Idade)</h4>
                                    <div className="form-group">
                                        <label>Nome do Responsável *</label>
                                        <input name="responsibleName" value={studentData.responsibleName} onChange={handleStudentChange} className="input-field" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Telefone do Responsável</label>
                                        <input name="responsiblePhone" value={studentData.responsiblePhone} onChange={handleStudentChange} className="input-field" placeholder="(00) 00000-0000" maxLength={15} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* STEP 2: SELEÇÃO DE TURMA */}
                    {step === 2 && (
                        <div>
                            <h4 style={{ marginBottom: '20px' }}>Selecione a Turma</h4>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Curso</label>
                                <select
                                    className="input-field"
                                    value={enrollmentData.courseId}
                                    onChange={e => setEnrollmentData({ ...enrollmentData, courseId: e.target.value, classId: '' })}
                                    style={{ fontSize: '1rem', padding: '10px' }}
                                >
                                    <option value="">Selecione o Curso...</option>
                                    {Array.from(new Set(classes.map(c => c.Course?.id))).map(cid => {
                                        const course = classes.find(c => c.Course?.id === cid)?.Course;
                                        return course ? <option key={cid} value={cid}>{course.name}</option> : null;
                                    })}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Turmas Disponíveis {enrollmentData.courseId ? '(Filtrado por curso)' : ''}</label>
                                <select
                                    className="input-field"
                                    value={enrollmentData.classId}
                                    onChange={e => setEnrollmentData({ ...enrollmentData, classId: e.target.value })}
                                    style={{ fontSize: '1rem', padding: '10px' }}
                                    disabled={!enrollmentData.courseId}
                                >
                                    <option value="">{enrollmentData.courseId ? 'Selecione a Turma...' : 'Selecione um curso primeiro'}</option>
                                    {classes
                                        .filter(c => !enrollmentData.courseId || String(c.Course?.id) === String(enrollmentData.courseId))
                                        .map(c => {
                                            const count = (c.Students || c.students || c.Enrollments || c.enrollments || []).length;
                                            const isFull = count >= c.capacity;
                                            const courseName = c.Course?.name || 'N/A';
                                            const classNum = c.classNumber || '-';
                                            return (
                                                <option key={c.id} value={c.id} style={{ color: isFull ? 'red' : 'inherit' }}>
                                                    {courseName} - {classNum} - {c.name} ({count}/{c.capacity} alunos) {isFull ? '[CHEIA]' : ''}
                                                </option>
                                            )
                                        })}
                                </select>
                            </div>
                            {enrollmentData.classId && (
                                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', marginTop: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <strong>Detalhes da Turma:</strong>
                                    {(() => {
                                        const c = classes.find(x => String(x.id) === String(enrollmentData.classId));
                                        return c ? (
                                            <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                                                <p>Curso: {c.Course?.name}</p>
                                                <p>Horário: {c.startTime} - {c.endTime}</p>
                                                <p>Professor: {c.professor?.name || 'N/A'}</p>
                                                <p>Início: {c.startDate ? c.startDate.split('-').reverse().join('/') : '-'}</p>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: FINANCEIRO */}
                    {step === 3 && (
                        <div>
                            <h4 style={{ marginBottom: '20px' }}>Plano Financeiro</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Matrícula */}
                                <div className="vox-card" style={{ padding: '24px' }}>
                                    <h5 style={{ marginBottom: '16px', color: 'var(--ios-teal)', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase' }}>Taxa de Matrícula</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem' }}>Valor (R$)</label>
                                            <CurrencyInput
                                                className="input-field"
                                                value={financialData.enrollmentFee.amount}
                                                onChange={val => handleFinancialChange('enrollmentFee', 'amount', val)}
                                                placeholder="0,00"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem' }}>Vencimento</label>
                                            <input type="date" className="input-field" value={financialData.enrollmentFee.dueDate} onChange={e => handleFinancialChange('enrollmentFee', 'dueDate', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem' }}>Forma Pag.</label>
                                            <select className="input-field" value={financialData.enrollmentFee.method} onChange={e => handleFinancialChange('enrollmentFee', 'method', e.target.value)}>
                                                {paymentOptions.map(option => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem' }}>Parcelas</label>
                                            <select className="input-field" value={financialData.enrollmentFee.installments} onChange={e => handleFinancialChange('enrollmentFee', 'installments', e.target.value)}>
                                                {[...Array(21)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}x</option>
                                                ))}
                                            </select>
                                            {financialData.enrollmentFee.installments > 1 && (
                                                <div style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: '2px', fontWeight: 600 }}>
                                                    {financialData.enrollmentFee.installments}x de R$ {(financialData.enrollmentFee.amount / financialData.enrollmentFee.installments).toFixed(2).replace('.', ',')}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '4px' }}>
                                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, userSelect: 'none' }}>
                                                <input
                                                    type="checkbox"
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                    checked={financialData.enrollmentFee.isPaid}
                                                    onChange={e => handleFinancialChange('enrollmentFee', 'isPaid', e.target.checked)}
                                                />
                                                <span>Já pago</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Curso */}
                                <div className="vox-card" style={{ padding: '24px' }}>
                                    <h5 style={{ marginBottom: '16px', color: 'var(--ios-teal)', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase' }}>Curso (Valor Total)</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem' }}>Valor Total (R$)</label>
                                            <CurrencyInput
                                                className="input-field"
                                                value={financialData.courseFee.amount}
                                                onChange={val => handleFinancialChange('courseFee', 'amount', val)}
                                                placeholder="0,00"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem' }}>1º Vencimento</label>
                                            <input type="date" className="input-field" value={financialData.courseFee.dueDate} onChange={e => handleFinancialChange('courseFee', 'dueDate', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem' }}>Forma Pag.</label>
                                            <select className="input-field" value={financialData.courseFee.method} onChange={e => handleFinancialChange('courseFee', 'method', e.target.value)}>
                                                {paymentOptions.map(option => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem' }}>Parcelas</label>
                                            <select className="input-field" value={financialData.courseFee.installments} onChange={e => handleFinancialChange('courseFee', 'installments', e.target.value)}>
                                                {[...Array(21)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}x</option>
                                                ))}
                                            </select>
                                            {financialData.courseFee.installments > 1 && (
                                                <div style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: '2px', fontWeight: 600 }}>
                                                    {financialData.courseFee.installments}x de R$ {(financialData.courseFee.amount / financialData.courseFee.installments).toFixed(2).replace('.', ',')}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '4px' }}>
                                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, userSelect: 'none' }}>
                                                <input
                                                    type="checkbox"
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                    checked={financialData.courseFee.isPaid}
                                                    onChange={e => handleFinancialChange('courseFee', 'isPaid', e.target.checked)}
                                                />
                                                <span>1ª Paga</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Material */}
                                <div className="vox-card" style={{ padding: '24px' }}>
                                    <h5 style={{ marginBottom: '16px', color: 'var(--ios-teal)', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase' }}>Material Didático</h5>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Origem do Material:</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'white', border: '1px solid var(--border)', borderRadius: '6px' }}>
                                                <input
                                                    type="radio"
                                                    name="materialSource"
                                                    value="stock"
                                                    checked={financialData.materialFee.source === 'stock'}
                                                    onChange={() => handleFinancialChange('materialFee', 'source', 'stock')}
                                                />
                                                <span style={{ fontSize: '0.9rem' }}>Estoque da Escola</span>
                                            </label>
                                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'white', border: '1px solid var(--border)', borderRadius: '6px' }}>
                                                <input
                                                    type="radio"
                                                    name="materialSource"
                                                    value="publisher"
                                                    checked={financialData.materialFee.source === 'publisher'}
                                                    onChange={() => handleFinancialChange('materialFee', 'source', 'publisher')}
                                                />
                                                <span style={{ fontSize: '0.9rem' }}>Direto com Editora</span>
                                            </label>
                                        </div>
                                    </div>

                                    {financialData.materialFee.source === 'stock' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem' }}>Valor (R$)</label>
                                                <CurrencyInput
                                                    className="input-field"
                                                    value={financialData.materialFee.amount}
                                                    onChange={val => handleFinancialChange('materialFee', 'amount', val)}
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem' }}>Vencimento</label>
                                                <input type="date" className="input-field" value={financialData.materialFee.dueDate} onChange={e => handleFinancialChange('materialFee', 'dueDate', e.target.value)} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem' }}>Forma Pag.</label>
                                                <select className="input-field" value={financialData.materialFee.method} onChange={e => handleFinancialChange('materialFee', 'method', e.target.value)}>
                                                    {paymentOptions.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem' }}>Parcelas</label>
                                                <select className="input-field" value={financialData.materialFee.installments} onChange={e => handleFinancialChange('materialFee', 'installments', e.target.value)}>
                                                    {[...Array(21)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1}>{i + 1}x</option>
                                                    ))}
                                                </select>
                                                {financialData.materialFee.installments > 1 && (
                                                    <div style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: '2px', fontWeight: 600 }}>
                                                        {financialData.materialFee.installments}x de R$ {(financialData.materialFee.amount / financialData.materialFee.installments).toFixed(2).replace('.', ',')}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '4px' }}>
                                                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, userSelect: 'none' }}>
                                                    <input
                                                        type="checkbox"
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                        checked={financialData.materialFee.isPaid}
                                                        onChange={e => handleFinancialChange('materialFee', 'isPaid', e.target.checked)}
                                                    />
                                                    <span>Já pago</span>
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '10px', background: 'var(--bg-app)', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            O pagamento será tratado externamente (Direto com a Editora). Nenhum registro financeiro será gerado para material.
                                        </div>
                                    )}
                                </div>

                                {/* Contrato */}
                                <div className="vox-card" style={{ padding: '24px', borderLeft: financialData.contractSigned ? '5px solid #34C759' : '5px solid #FF9500' }}>
                                    <h5 style={{ marginBottom: '10px', color: '#1C1C1E', fontWeight: '900' }}>Status do Contrato</h5>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            backgroundColor: financialData.contractSigned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: financialData.contractSigned ? '#10b981' : '#f59e0b',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {financialData.contractSigned ? <Check size={18} /> : <AlertTriangle size={18} />}
                                            {financialData.contractSigned ? 'CONTRATO ASSINADO' : 'PENDENTE DE ASSINATURA'}
                                        </div>
                                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={financialData.contractSigned}
                                                onChange={e => setFinancialData(prev => ({ ...prev, contractSigned: e.target.checked }))}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            Confirmar assinatura do contrato agora
                                        </label>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ACTIONS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        {step > 1 ? (
                            <button onClick={prevStep} className="btn-secondary" disabled={loading}><ArrowLeft size={16} /> Voltar</button>
                        ) : <div></div>}

                        {step < 3 ? (
                            <button onClick={nextStep} className="btn-primary">Próximo <ArrowRight size={16} /></button>
                        ) : (
                            <button onClick={handleFinalSubmit} className="btn-primary" disabled={loading} style={{ backgroundColor: '#34C759', boxShadow: '0 4px 10px rgba(52, 199, 89, 0.4)' }}>
                                {loading ? 'Salvando...' : <><Check size={16} /> Finalizar Matrícula</>}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentRegistrationWizard;
