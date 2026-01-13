import React, { useState, useEffect } from 'react';
import { X, Check, Save } from 'lucide-react';
import { VoxModal, VoxButton } from '../../components/VoxUI';
import { formatCPF, formatPhone, formatCEP, validateCPF, validatePhone, validateCEP, fetchAddressByCEP } from '../../utils/validators';

const EditStudentModal = ({ isOpen, onClose, student, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        phone: '',
        cpf: '',
        birthDate: '',
        gender: '',
        profession: '',
        workplace: '',
        cep: '',
        address: '',
        neighborhood: '',
        city: '',
        responsibleName: '',
        responsiblePhone: '',
        status: ''
    });

    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name || '',
                email: student.email || '',
                mobile: student.mobile || '',
                phone: student.phone || '',
                cpf: student.cpf || '',
                birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
                gender: student.gender || '',
                profession: student.profession || '',
                workplace: student.workplace || '',
                cep: student.cep || '',
                address: student.address || '',
                neighborhood: student.neighborhood || '',
                city: student.city || '',
                responsibleName: student.responsibleName || '',
                responsiblePhone: student.responsiblePhone || '',
                status: student.status || 'active'
            });
        }
    }, [student]);

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cpf') value = formatCPF(value);
        if (name === 'mobile' || name === 'phone' || name === 'responsiblePhone') value = formatPhone(value);
        if (name === 'cep') value = formatCEP(value);

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCepBlur = async () => {
        if (validateCEP(formData.cep)) {
            setLoadingCep(true);
            const address = await fetchAddressByCEP(formData.cep);
            setLoadingCep(false);
            if (address) {
                setFormData(prev => ({
                    ...prev,
                    address: address.address,
                    neighborhood: address.neighborhood,
                    city: address.city
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students/${student.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || 'Erro ao atualizar aluno');
            }
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Erro de conexão ao atualizar aluno');
        } finally {
            setLoading(false);
        }
    };

    return (
        <VoxModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Editar Aluno: ${student?.name}`}
            width="800px"
        >
            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="block text-sm font-semibold mb-1">Nome Completo *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded">
                                <option value="active">Ativo</option>
                                <option value="locked">Trancado</option>
                                <option value="cancelled">Cancelado</option>
                                <option value="completed">Formado</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Gênero</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded">
                                <option value="">Selecione...</option>
                                <option value="M">Masculino</option>
                                <option value="F">Feminino</option>
                                <option value="O">Outro</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-semibold mb-1">Email *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Celular *</label>
                            <input name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">CPF *</label>
                            <input name="cpf" value={formData.cpf} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Data de Nascimento</label>
                            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full p-2 border rounded" />
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Profissão</label>
                            <input name="profession" value={formData.profession} onChange={handleChange} className="w-full p-2 border rounded" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Empresa / Trabalho</label>
                            <input name="workplace" value={formData.workplace} onChange={handleChange} className="w-full p-2 border rounded" />
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Cidade</label>
                            <input name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded" />
                        </div>
                    </div>

                    <div className="form-group md:col-span-2">
                        <h4 className="border-b pb-1 mb-2 font-bold text-indigo-600">Endereço</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">CEP</label>
                            <input name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} className="w-full p-2 border rounded" />
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Bairro</label>
                            <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full p-2 border rounded" />
                        </div>
                    </div>

                    <div className="form-group md:col-span-2">
                        <label className="block text-sm font-semibold mb-1">Endereço Completo</label>
                        <input name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded" />
                    </div>

                    <div className="form-group md:col-span-2">
                        <h4 className="border-b pb-1 mb-2 font-bold text-orange-600">Responsável (para menores)</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Nome do Responsável</label>
                            <input name="responsibleName" value={formData.responsibleName} onChange={handleChange} className="w-full p-2 border rounded" />
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-semibold mb-1">Telefone do Responsável</label>
                            <input name="responsiblePhone" value={formData.responsiblePhone} onChange={handleChange} className="w-full p-2 border rounded" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <VoxButton type="button" variant="secondary" onClick={onClose}>Cancelar</VoxButton>
                    <VoxButton type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </VoxButton>
                </div>
            </form>
        </VoxModal>
    );
};

export default EditStudentModal;
