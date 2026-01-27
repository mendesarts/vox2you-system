import React, { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { VoxModal } from '../../components/VoxUI';

const StudentImportModal = ({ isOpen, onClose, onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const COLUMN_MAPPING = {
        'Nome': 'name',
        'NumeroMatricula': 'registrationNumber',
        'CPF': 'cpf',
        'RG': 'rg',
        'Sexo': 'gender',
        'DataNascimento': 'birthDate',
        'FoneCelular': 'mobile',
        'FoneResidencial': 'phone',
        'FoneComercial': 'workPhone',
        'Email': 'email',
        'Endereco': 'address',
        'NumeroEndereco': 'addressNumber',
        'ComplementoEndereco': 'addressComplement',
        'Bairro': 'neighborhood',
        'Cidade': 'city',
        'UFEndereco': 'state',
        'CEP': 'cep',
        'Profissao': 'profession',
        'LocalTrabalho': 'workplace',
        'NomeRespFin': 'responsibleName',
        'FoneResidencialRespFin': 'responsiblePhone',
        'FoneCelularRespFin': 'responsibleMobile',
        'EmailRespFin': 'responsibleEmail',
        'CPFRespFinanceiro': 'responsibleCPF',
        'NomePai': 'fatherName',
        'ProfissaoPai': 'fatherProfession',
        'EmailPai': 'fatherEmail',
        'FoneRespPai': 'fatherPhone',
        'CelularRespPai': 'fatherMobile',
        'NomeMae': 'motherName',
        'ProfissaoMae': 'motherProfession',
        'EmailMae': 'motherEmail',
        'FoneRespMae': 'motherPhone',
        'CelularRespMae': 'motherMobile',
        'Observacao': 'observation',
        'DataCadastro': 'registrationDate',
        'Situacao': 'status',
        'NomeUnidade': 'unitName'
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            // Format: "DD/MM/YYYY HH:mm:ss" or "DD/MM/YYYY"
            const parts = String(dateStr).split(' ')[0].split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        } catch (e) {
            console.error('Error parsing date:', dateStr, e);
        }
        return null;
    };

    const normalizePhone = (phone) => {
        if (!phone) return '';
        return String(phone).replace(/\D/g, '');
    };

    const normalizeCPF = (cpf) => {
        if (!cpf) return '';
        const clean = String(cpf).replace(/\D/g, '');
        return clean.padStart(11, '0');
    };

    const mapStatus = (status) => {
        const statusMap = {
            'Ativo': 'active',
            'Trancado': 'locked',
            'Cancelado': 'cancelled',
            'Formado': 'completed'
        };
        return statusMap[status] || 'active';
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Extension validation removed to rely on HTML accept and XLSX parser robustness

        setFile(selectedFile);
        setError(null);
        setResults(null);
    };

    const processFile = async () => {
        if (!file) {
            setError('Nenhum arquivo selecionado');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    let workbook;
                    try {
                        workbook = XLSX.read(data, { type: 'array' });
                    } catch (readErr) {
                        throw new Error('Falha ao ler o arquivo. Verifique se é um Excel válido (.xls, .xlsx).');
                    }

                    const sheetName = workbook.SheetNames[0];
                    if (!sheetName) throw new Error('O arquivo Excel não possui planilhas.');

                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // ... (rest of parsing logic)

                    // Find header row (skip title rows)
                    let headerRowIndex = -1;
                    for (let i = 0; i < jsonData.length; i++) {
                        if (jsonData[i].includes('Nome') && jsonData[i].includes('CPF')) {
                            headerRowIndex = i;
                            break;
                        }
                    }

                    if (headerRowIndex === -1) {
                        throw new Error('Cabeçalhos não encontrados na planilha (Procure por "Nome" e "CPF")');
                    }

                    const headers = jsonData[headerRowIndex];
                    const dataRows = jsonData.slice(headerRowIndex + 1);

                    // Process students
                    const students = [];
                    const errors = [];

                    for (let i = 0; i < dataRows.length; i++) {
                        const row = dataRows[i];
                        if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

                        try {
                            const student = {};

                            headers.forEach((header, index) => {
                                const mappedField = COLUMN_MAPPING[header];
                                if (mappedField && row[index]) {
                                    student[mappedField] = row[index];
                                }
                            });

                            // Required fields validation
                            if (!student.name) {
                                errors.push({ row: i + 1, error: 'Nome é obrigatório' });
                                continue;
                            }

                            // Process special fields
                            if (student.birthDate) {
                                student.birthDate = parseDate(student.birthDate);
                            }
                            if (student.registrationDate) {
                                student.registrationDate = parseDate(student.registrationDate);
                            }
                            if (student.mobile) {
                                student.mobile = normalizePhone(student.mobile);
                            }
                            if (student.phone) {
                                student.phone = normalizePhone(student.phone);
                            }
                            if (student.cpf) {
                                student.cpf = normalizeCPF(student.cpf);
                            }
                            if (student.responsibleCPF) {
                                student.responsibleCPF = normalizeCPF(student.responsibleCPF);
                            }
                            if (student.status) {
                                student.status = mapStatus(student.status);
                            }

                            students.push(student);
                        } catch (err) {
                            errors.push({ row: i + 1, error: err.message });
                        }
                    }

                    // Send to backend
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students/import/bulk`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ students })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Erro ao importar alunos');
                    }

                    const result = await response.json();

                    setResults({
                        total: students.length,
                        success: result.success || 0,
                        errors: [...errors, ...(result.errors || [])],
                        duplicates: result.duplicates || 0,
                        updated: result.updated || 0
                    });

                    if (onImportComplete) {
                        onImportComplete(result);
                    }

                } catch (err) {
                    console.error('Processing error:', err);
                    setError(err.message || 'Erro ao processar arquivo');
                } finally {
                    setProcessing(false);
                }
            };

            reader.onerror = () => {
                setError('Erro ao ler arquivo');
                setProcessing(false);
            };

            reader.readAsArrayBuffer(file);

        } catch (err) {
            console.error('File read error:', err);
            setError(err.message || 'Erro ao ler arquivo');
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResults(null);
        setError(null);
        setProcessing(false);
        onClose();
    };

    return (
        <VoxModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Importar Alunos"
            width="600px"
        >
            <div style={{ padding: '24px' }}>
                {!results ? (
                    <>
                        <div style={{
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '24px'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#0369a1', fontSize: '14px', fontWeight: '700' }}>
                                📋 Formato da Planilha
                            </h4>
                            <p style={{ margin: 0, color: '#0c4a6e', fontSize: '13px', lineHeight: '1.6' }}>
                                A planilha deve estar no formato padrão do sistema anterior (Sponte).
                                Os dados serão importados automaticamente com base nas colunas conhecidas.
                            </p>
                        </div>

                        <div style={{
                            border: '2px dashed #cbd5e1',
                            borderRadius: '12px',
                            padding: '32px',
                            textAlign: 'center',
                            background: '#f8fafc',
                            marginBottom: '16px'
                        }}>
                            <FileSpreadsheet size={48} color="#64748b" style={{ margin: '0 auto 16px' }} />

                            {!file ? (
                                <>
                                    <p style={{ color: '#475569', marginBottom: '16px', fontSize: '14px' }}>
                                        Selecione um arquivo Excel (.xls, .xlsx) ou CSV
                                    </p>
                                    <label style={{
                                        display: 'inline-block',
                                        padding: '12px 24px',
                                        background: '#3b82f6',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }}>
                                        <Upload size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                        Selecionar Arquivo
                                        <input
                                            type="file"
                                            accept=".xls,.xlsx,.csv,.xlsm,.xlsb,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                                    <p style={{ color: '#059669', fontWeight: '600', marginBottom: '8px' }}>
                                        {file.name}
                                    </p>
                                    <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                    <button
                                        onClick={() => setFile(null)}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Remover Arquivo
                                    </button>
                                </>
                            )}
                        </div>

                        {error && (
                            <div style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <AlertCircle size={20} color="#dc2626" />
                                <span style={{ color: '#991b1b', fontSize: '14px' }}>{error}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleClose}
                                style={{
                                    padding: '10px 20px',
                                    background: 'transparent',
                                    color: '#64748b',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={processFile}
                                disabled={!file || processing}
                                style={{
                                    padding: '10px 24px',
                                    background: file && !processing ? '#3b82f6' : '#cbd5e1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: file && !processing ? 'pointer' : 'not-allowed',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {processing ? (
                                    <>
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid white',
                                            borderTopColor: 'transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Importar Alunos
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div>
                        <div style={{
                            background: results.errors.length > 0 ? '#fef3c7' : '#d1fae5',
                            border: `1px solid ${results.errors.length > 0 ? '#fcd34d' : '#6ee7b7'}`,
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '24px',
                            textAlign: 'center'
                        }}>
                            {results.errors.length === 0 ? (
                                <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 16px' }} />
                            ) : (
                                <AlertCircle size={48} color="#d97706" style={{ margin: '0 auto 16px' }} />
                            )}
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>
                                Importação Concluída
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669' }}>
                                        {results.success}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#064e3b', fontWeight: '600' }}>
                                        Importados
                                    </div>
                                </div>
                                {results.updated > 0 && (
                                    <div>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>
                                            {results.updated}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                                            Atualizados
                                        </div>
                                    </div>
                                )}
                                {results.duplicates > 0 && (
                                    <div>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>
                                            {results.duplicates}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600' }}>
                                            Duplicados
                                        </div>
                                    </div>
                                )}
                                {results.errors.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#dc2626' }}>
                                            {results.errors.length}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>
                                            Erros
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {results.errors.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#475569' }}>
                                    Erros Encontrados:
                                </h4>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                                    {results.errors.slice(0, 10).map((err, idx) => (
                                        <div key={idx} style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                                            • Linha {err.row}: {err.error}
                                        </div>
                                    ))}
                                    {results.errors.length > 10 && (
                                        <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                                            ... e mais {results.errors.length - 10} erros
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleClose}
                                style={{
                                    padding: '10px 24px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </VoxModal>
    );
};

export default StudentImportModal;
