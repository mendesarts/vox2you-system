import React, { useState } from 'react';
import { FileText, Download, Eye, Loader, X, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ContractModal = ({ student, isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const handlePreview = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/contracts/preview/${student.id}`);
            setPreview(response.data.data);
            setShowPreview(true);
        } catch (error) {
            console.error('Erro ao carregar preview:', error);
            alert('Erro ao carregar preview do contrato');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/contracts/student/${student.id}`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Contrato_${student.name.replace(/\s/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            alert('Contrato gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar contrato:', error);
            alert('Erro ao gerar contrato');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-600" />
                            Contrato de Prestação de Serviços
                        </h2>
                        <p className="text-gray-600 mt-1">Aluno: {student.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!showPreview ? (
                        <div className="text-center py-12">
                            <FileText className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Gerar Contrato
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                O contrato será gerado automaticamente com todos os dados do aluno,
                                curso e informações financeiras.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handlePreview}
                                    disabled={loading}
                                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                    Visualizar Dados
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Download className="w-5 h-5" />
                                    )}
                                    Gerar PDF
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Preview Header */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-blue-800 mb-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-semibold">Preview do Contrato</span>
                                </div>
                                <p className="text-sm text-blue-700">
                                    Confira os dados abaixo antes de gerar o PDF final.
                                </p>
                            </div>

                            {/* Contract Data */}
                            {preview && (
                                <div className="space-y-6">
                                    {/* Contract Info */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Informações do Contrato</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Número:</span>
                                                <span className="ml-2 font-medium">{preview.contractNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Data:</span>
                                                <span className="ml-2 font-medium">{preview.contractDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Student Data */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Dados do Contratante</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><strong>Nome:</strong> {preview.studentName}</div>
                                            <div><strong>CPF:</strong> {preview.studentCPF}</div>
                                            <div><strong>RG:</strong> {preview.studentRG}</div>
                                            <div><strong>Data Nasc:</strong> {preview.studentBirthDate}</div>
                                            <div className="col-span-2"><strong>Endereço:</strong> {preview.studentAddress}, {preview.studentNeighborhood}</div>
                                            <div><strong>Cidade:</strong> {preview.studentCity}/{preview.studentState}</div>
                                            <div><strong>CEP:</strong> {preview.studentCEP}</div>
                                            <div><strong>Telefone:</strong> {preview.studentPhone}</div>
                                            <div><strong>E-mail:</strong> {preview.studentEmail}</div>
                                        </div>
                                    </div>

                                    {/* Course Data */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Dados do Curso</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><strong>Curso:</strong> {preview.courseName}</div>
                                            <div><strong>Nível:</strong> {preview.courseLevel}</div>
                                            <div><strong>Turma:</strong> {preview.className}</div>
                                            <div><strong>Duração:</strong> {preview.courseDuration}</div>
                                            <div className="col-span-2"><strong>Horário:</strong> {preview.classSchedule}</div>
                                            <div><strong>Início:</strong> {preview.startDate}</div>
                                            <div><strong>Término:</strong> {preview.endDate}</div>
                                        </div>
                                    </div>

                                    {/* Financial Data */}
                                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                                        <h4 className="font-semibold text-gray-900 mb-3">Dados Financeiros</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><strong>Valor Total:</strong> <span className="text-green-700 font-bold">{preview.totalValue}</span></div>
                                            <div><strong>Forma de Pagamento:</strong> {preview.paymentMethod}</div>
                                            <div><strong>Parcelas:</strong> {preview.installments}x de {preview.installmentValue}</div>
                                            <div><strong>Vencimento:</strong> Dia {preview.dueDay} de cada mês</div>
                                        </div>
                                    </div>

                                    {/* Unit Data */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Dados da Contratada</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><strong>Unidade:</strong> {preview.unitName}</div>
                                            <div><strong>CNPJ:</strong> {preview.unitCNPJ}</div>
                                            <div><strong>Cidade:</strong> {preview.unitCity}/{preview.unitState}</div>
                                            <div><strong>Telefone:</strong> {preview.unitPhone}</div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex justify-center pt-4">
                                        <button
                                            onClick={handleDownload}
                                            disabled={loading}
                                            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-3 text-lg font-semibold disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader className="w-6 h-6 animate-spin" />
                                                    Gerando PDF...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-6 h-6" />
                                                    Gerar Contrato em PDF
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractModal;
