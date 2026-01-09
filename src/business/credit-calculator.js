import { addMonths } from 'date-fns';

export const calculateCredit = (amount, term, termType, rate, startDate) => {
  const months = termType === 'years' ? term * 12 : term;
  const monthlyRate = rate / 100 / 12;
  
  // Аннуитетный платеж
  let monthlyPayment;
  if (rate === 0) {
      monthlyPayment = amount / months;
  } else {
      monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }
  
  let currentBalance = amount;
  const schedule = [];
  
  for (let i = 1; i <= months; i++) {
    const interestPayment = currentBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    currentBalance -= principalPayment;
    
    // Корректировка последнего платежа для точного закрытия кредита
    if (i === months) {
       currentBalance = 0; 
    }

    schedule.push({
      number: i,
      date: addMonths(startDate, i),
      amount: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, currentBalance)
    });
  }
  
  return schedule;
};
