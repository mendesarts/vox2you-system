export const validateCPF = (cpf) => {
    if (!cpf) return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
};

export const formatCPF = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

export const validatePhone = (phone) => {
    const cleanBox = phone.replace(/\D/g, '');
    // Support 10 (Landline), 11 (Mobile), 12-13 (Country Code)
    return cleanBox.length >= 10 && cleanBox.length <= 13;
};

export const formatPhone = (value) => {
    return value
        .replace(/\D/g, '')
        // (55) (61) 99999-9999 -> 13
        // (55) (61) 9999-9999  -> 12
        .replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
        .replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4')
        // Standard 11
        .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
        .replace(/(-\d{4})\d+?$/, '$1');
};
// Simple permissive formatter to avoid slicing important numbers
export const formatPhonePermissive = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length > 13) return `+${v.slice(0, 2)} (${v.slice(2, 4)}) ${v.slice(4, 9)}-${v.slice(9, 13)}`;
    if (v.length === 13) return `+${v.slice(0, 2)} (${v.slice(2, 4)}) ${v.slice(4, 9)}-${v.slice(9)}`;
    if (v.length === 12) return `+${v.slice(0, 2)} (${v.slice(2, 4)}) ${v.slice(4, 8)}-${v.slice(8)}`;
    if (v.length > 11) return v; // Just return raw if weird
    if (v.length === 11) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length === 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    return v;
};

export const validateCEP = (cep) => {
    return cep.replace(/\D/g, '').length === 8;
};

export const formatCEP = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

export const fetchAddressByCEP = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (data.erro) return null;
        return {
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            uf: data.uf
        };
    } catch (error) {
        console.error('Error fetching CEP:', error);
        return null;
    }
};
