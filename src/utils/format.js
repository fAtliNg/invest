export const formatPrice = (value) => {
  if (value === null || value === undefined) return '-';
  
  // For very small numbers (absolute value < 0.1), show more precision
  if (value !== 0 && Math.abs(value) < 0.1) {
    return value.toLocaleString('ru-RU', { 
      style: 'currency', 
      currency: 'RUB',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    });
  }

  return value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
};

export const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const formatNumber = (value) => {
  return value ? value.toLocaleString('ru-RU') : '-';
};

export const formatLargeNumber = (value) => {
  if (!value) return '-';
  
  if (value >= 1e12) {
    return (value / 1e12).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + 'T';
  }
  if (value >= 1e9) {
    return (value / 1e9).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + 'B';
  }
  if (value >= 1e6) {
    return (value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + 'M';
  }
  
  return value.toLocaleString('ru-RU');
};
