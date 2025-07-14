export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const COUNTRIES = {
  BR: { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  PY: { code: 'PY', name: 'Paraguai', flag: '🇵🇾' },
  AR: { code: 'AR', name: 'Argentina', flag: '🇦🇷' }
};

export const DOCUMENT_TYPES = {
  CRT: 'CRT',
  MIC_DTA_NORMAL: 'MIC/DTA Normal',
  MIC_DTA_LASTRE: 'MIC/DTA Lastre'
};

export const MIC_DTA_TYPES = {
  NORMAL: 'NORMAL',
  LASTRE: 'LASTRE'
};