import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Phone, MessageCircle, Loader } from 'lucide-react';
import api from '../services/api';

const StudentsAtRiskModal = ({ isOpen, onClose }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [summary, setSummary] = useState({ high: 0, medium: 0, low: 0 });

    useEffect(() => {
        if (isOpen) {
            fetchStudentsAtRisk();
        }
    }, [isOpen]);

    const fetchStudentsAtRisk = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reports/students-at-risk');
            setStudents(response.data.data || []);
            setSummary(response.data.summary || { high: 0, medium: 0, low: 0 });
        } catch (error) {
            console.error('Erro ao buscar alunos em risco:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'high': return 'bg-red-100 text-red-800 border-red-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case 'high': return '🚨';
            case 'medium': return '⚠️';
            default: return 'ℹ️';
        }
    };

    const getRiskLabel = (level) => {
        switch (level) {
            case 'high': return 'ALTO';
            case 'medium': return 'MÉDIO';
            default: return 'BAIXO';
        }
    };

    const getFactorIcon = (type) => {
        switch (type) {
            case 'consecutive_absences': return '📅';
            case 'overdue_payments': return '💰';
            default: return '⚠️';
        }
    };

    const filteredStudents = students.filter(s => {
        if (filter === 'all') return true;
        return s.riskLevel === filter;
    });

    const handleCall = (phone) => {
        window.open(`tel:${phone}`, '_self');
    };

    const handleWhatsApp = (phone) => {
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <AlertTriangle className="w-7 h-7" />
                                Alunos em Risco
                            </h2>
                            <p className="text-white/90 mt-1">
                                Alunos que necessitam atenção especial
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${filter === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => setFilter('all')}
                                >
                                    <div className="text-sm text-gray-600 mb-1">Total</div>
                                    <div className="text-3xl font-bold text-gray-900">{students.length}</div>
                                </div>

                                <div
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${filter === 'high' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => setFilter('high')}
                                >
                                    <div className="text-sm text-red-600 mb-1">🚨 Alto</div>
                                    <div className="text-3xl font-bold text-red-700">{summary.high}</div>
                                </div>

                                <div
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${filter === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => setFilter('medium')}
                                >
                                    <div className="text-sm text-yellow-600 mb-1">⚠️ Médio</div>
                                    <div className="text-3xl font-bold text-yellow-700">{summary.medium}</div>
                                </div>

                                <div
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${filter === 'low' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => setFilter('low')}
                                >
                                    <div className="text-sm text-blue-600 mb-1">ℹ️ Baixo</div>
                                    <div className="text-3xl font-bold text-blue-700">{summary.low}</div>
                                </div>
                            </div>

                            {/* Students List */}
                            {filteredStudents.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <div className="text-6xl mb-4">✅</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Nenhum aluno em risco!
                                    </h3>
                                    <p className="text-gray-600">
                                        {filter === 'all'
                                            ? 'Todos os alunos estão com bom desempenho.'
                                            : `Nenhum aluno com risco ${getRiskLabel(filter).toLowerCase()}.`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            className={`rounded-lg border-2 p-5 ${getRiskColor(student.riskLevel)}`}
                                        >
                                            {/* Student Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-2xl">{getRiskIcon(student.riskLevel)}</span>
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            {student.name}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(student.riskLevel)}`}>
                                                            RISCO {getRiskLabel(student.riskLevel)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-700 space-y-1">
                                                        {student.course && <div>📚 {student.course}</div>}
                                                        {student.class && <div>👥 {student.class}</div>}
                                                        <div>📱 {student.phone}</div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCall(student.phone)}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        Ligar
                                                    </button>
                                                    <button
                                                        onClick={() => handleWhatsApp(student.phone)}
                                                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        WhatsApp
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Risk Factors */}
                                            <div className="border-t-2 border-gray-200 pt-3">
                                                <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                                    Fatores de Risco ({student.totalRiskFactors})
                                                </h4>
                                                <div className="space-y-2">
                                                    {student.riskFactors.map((factor, index) => (
                                                        <div
                                                            key={index}
                                                            className={`p-3 rounded-lg border text-sm ${factor.severity === 'high'
                                                                    ? 'bg-red-50 border-red-200'
                                                                    : 'bg-yellow-50 border-yellow-200'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span>{getFactorIcon(factor.type)}</span>
                                                                <span className="font-medium text-gray-900">
                                                                    {factor.description}
                                                                </span>
                                                                {factor.severity === 'high' && (
                                                                    <span className="ml-auto px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                                                                        URGENTE
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentsAtRiskModal;
