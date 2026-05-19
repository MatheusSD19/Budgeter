// Budgeter - Formatters
// Funções de formatação de moeda, números e datas

const formatters = {
    // Formatar valor monetário brasileiro
    currency: (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return 'R$ 0,00';
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Formatar número com separadores brasileiros
    number: (value, decimals = 2) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '0,00';
        }
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    },

    // Formatar percentual
    percent: (value, decimals = 1) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '0,0%';
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value / 100);
    },

    // Parse de string monetária para número
    parseCurrency: (value) => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        
        // Remove R$, pontos e espaços, troca vírgula por ponto
        const cleaned = value
            .replace(/R\$\s?/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();
        
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    },

    // Formatar input enquanto digita
    formatInputCurrency: (value) => {
        // Remove tudo exceto dígitos e vírgula
        let cleaned = value.replace(/[^\d,]/g, '');
        
        // Garante apenas uma vírgula
        const parts = cleaned.split(',');
        if (parts.length > 2) {
            cleaned = parts[0] + ',' + parts.slice(1).join('');
        }
        
        // Limita a 2 casas decimais
        if (parts[1] && parts[1].length > 2) {
            cleaned = parts[0] + ',' + parts[1].substring(0, 2);
        }
        
        return cleaned;
    },

    // Formatar data
    date: (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleDateString('pt-BR');
    },

    // Formatar data e hora
    datetime: (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleString('pt-BR');
    },

    // Abreviar número grande (1k, 1M, 1B)
    compactNumber: (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }
        
        const absValue = Math.abs(value);
        
        if (absValue >= 1e9) {
            return (value / 1e9).toFixed(1) + 'B';
        }
        if (absValue >= 1e6) {
            return (value / 1e6).toFixed(1) + 'M';
        }
        if (absValue >= 1e3) {
            return (value / 1e3).toFixed(1) + 'k';
        }
        
        return value.toString();
    }
};

// Exporta para uso em outros módulos
window.formatters = formatters;

export default formatters;
