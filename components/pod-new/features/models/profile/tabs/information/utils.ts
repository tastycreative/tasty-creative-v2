
export interface EditingState {
  creatorName: string;
  itemName: string;
  originalValue: string;
  newValue: string;
  creatorRowNumber?: number;
  creatorRowId?: string;
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatUsdFlexible = (amount: number | string | undefined | null) => {
  if (amount === undefined || amount === null || amount === '') return 'N/A';
  
  // If it's already a string with $, return as is
  if (typeof amount === 'string' && amount.includes('$')) return amount;
  
  try {
    // Clean string if needed (remove non-numeric except dot)
    const numericVal = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[^0-9.-]/g, ''))
      : amount;
      
    if (isNaN(numericVal)) return amount.toString();
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericVal);
  } catch (e) {
    return amount.toString();
  }
};

export const formatDateSafely = (dateValue: string | null | undefined) => {
  if (!dateValue || dateValue === 'N/A') return 'N/A';
  try {
    return new Date(dateValue).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      day: 'numeric'
    });
  } catch (e) {
    return dateValue;
  }
};
