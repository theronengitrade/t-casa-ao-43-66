export type CurrencyType = 'AOA' | 'EUR' | 'BRL' | 'MZN';

export const currencySymbols: Record<CurrencyType, string> = {
  AOA: 'Kz',
  EUR: '€',
  BRL: 'R$',
  MZN: 'MT'
};

export const currencyNames: Record<CurrencyType, string> = {
  AOA: 'Kwanza Angolano',
  EUR: 'Euro',
  BRL: 'Real Brasileiro',
  MZN: 'Metical Moçambicano'
};

export const formatCurrency = (
  amount: number | string,
  currency: CurrencyType = 'AOA',
  locale: string = 'pt-PT'
): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '';

  const symbol = currencySymbols[currency];
  
  // Format based on currency and locale
  const formatter = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formattedNumber = formatter.format(numericAmount);

  // Different positioning for different currencies
  switch (currency) {
    case 'EUR':
      return `${formattedNumber} ${symbol}`;
    case 'BRL':
      return `${symbol} ${formattedNumber}`;
    case 'AOA':
    case 'MZN':
    default:
      return `${formattedNumber} ${symbol}`;
  }
};

export const parseCurrency = (formattedAmount: string): number => {
  // Remove all non-numeric characters except comma and dot
  const cleanAmount = formattedAmount.replace(/[^\d,.]/g, '');
  
  // Handle different decimal separators
  const normalizedAmount = cleanAmount.replace(',', '.');
  
  return parseFloat(normalizedAmount) || 0;
};