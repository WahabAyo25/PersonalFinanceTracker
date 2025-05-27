export const formatCurrency = (
    amount: number, 
    currency: 'GBP' | 'NGN' | 'USD'
  ) => {
    try {
      if (currency === 'NGN') {
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      }
  
      if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      }
  
      // Default to GBP
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      
    } catch (error) {
      console.error('Currency formatting error:', error);
      // Fallback formatting
      return currency === 'NGN' ? `₦${amount.toFixed(2)}` 
        : currency === 'USD' ? `$${amount.toFixed(2)}`
        : `£${amount.toFixed(2)}`;
    }
  };