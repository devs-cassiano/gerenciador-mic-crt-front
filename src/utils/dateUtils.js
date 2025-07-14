/**
 * Utilitários para formatação de datas
 */

/**
 * Formata uma data para o padrão brasileiro DD/MM/YYYY
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada ou '-' se inválida
 */
export const formatDateBR = (date) => {
  if (!date) return '-';

  try {
    // Aceita string DD/MM/YYYY ou ISO
    let dateObj;
    if (typeof date === 'string') {
      // Se for DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [day, month, year] = date.split('/').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        // Tenta ISO ou outros formatos
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return '-';
  }
};

/**
 * Formata uma data para o padrão brasileiro DD/MM/YYYY HH:mm
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data e hora formatada ou '-' se inválida
 */
export const formatDateTimeBR = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '-';
  }
};

/**
 * Converte uma data para o formato ISO (YYYY-MM-DD) para inputs date
 * @param {string|Date} date - Data a ser convertida
 * @returns {string} Data no formato ISO ou string vazia se inválida
 */
export const dateToISO = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

/**
 * Converte uma string no formato DD/MM/YYYY para Date
 * @param {string} dateStr - String da data no formato DD/MM/YYYY
 * @returns {Date|null} Objeto Date ou null se inválida
 */
export const parseDateBR = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  
  // Verificar se a data é válida
  if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
    return date;
  }
  
  return null;
};
