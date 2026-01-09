import { addMonths, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';

const calculateAnnuity = (amount, months, monthlyRate) => {
  if (months <= 0) return 0;
  if (monthlyRate === 0) return amount / months;
  return amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
};

const getFrequencyMonths = (frequency) => {
  switch (frequency) {
    case '1_month': return 1;
    case '2_months': return 2;
    case '3_months': return 3;
    case '4_months': return 4;
    case '6_months': return 6;
    case '9_months': return 9;
    case '12_months': return 12;
    default: return 0;
  }
};

export const calculateCredit = (amount, term, termType, rate, startDate, earlyRepayments = []) => {
  const initialMonths = termType === 'years' ? term * 12 : term;
  const monthlyRate = rate / 100 / 12;
  
  let monthlyPayment = calculateAnnuity(amount, initialMonths, monthlyRate);
  
  let currentBalance = amount;
  const schedule = [];
  
  // Expand early repayments
  let repaymentEvents = [];
  const maxCalculationDate = addMonths(startDate, initialMonths + 120); // Limit to avoid infinite loops

  earlyRepayments.forEach(rule => {
    let ruleDate = startOfDay(new Date(rule.date));
    const frequencyMonths = getFrequencyMonths(rule.frequency);
    
    if (rule.frequency === 'once') {
      repaymentEvents.push({
        id: rule.id,
        date: ruleDate,
        amount: Number(rule.amount),
        recalcType: rule.recalcType
      });
    } else if (frequencyMonths > 0) {
      // Periodic
      let currentDate = ruleDate;
      // Generate events up to max date
      while (isBefore(currentDate, maxCalculationDate)) {
        repaymentEvents.push({
          id: rule.id,
          date: currentDate,
          amount: Number(rule.amount),
          recalcType: rule.recalcType
        });
        currentDate = addMonths(currentDate, frequencyMonths);
      }
    }
  });

  // Sort events by date
  repaymentEvents.sort((a, b) => a.date - b.date);

  let i = 1;
  const MAX_ITERATIONS = 600;

  while (currentBalance > 0.01 && i <= MAX_ITERATIONS) {
    const periodStart = startOfDay(addMonths(startDate, i - 1));
    const periodEnd = startOfDay(addMonths(startDate, i));
    
    const events = repaymentEvents.filter(e => 
        (i === 1 ? (isAfter(e.date, periodStart) || isEqual(e.date, periodStart)) : isAfter(e.date, periodStart)) && 
        (isBefore(e.date, periodEnd) || isEqual(e.date, periodEnd))
    );

    // Apply early repayments FIRST? Or together with payment?
    // User wants separate row.
    // Logic: 
    // 1. Check if we have early repayments in this period.
    // 2. If yes, for each event:
    //    a. Calculate interest up to this date? (Complex)
    //    b. Or just assume it happens on payment date?
    //    Let's assume for simplicity (as before) that they happen effectively at the payment moment, 
    //    but we will output them as separate rows.
    
    // BUT if we output separate rows, we should update balance in between?
    // If I update balance, the regular payment calculation (which depends on balance start of month) might change?
    // Standard banking practice: Early repayment reduces principal immediately.
    // Interest for the NEXT period will be lower.
    // Interest for THIS period is usually already accrued on the full balance?
    // Let's stick to the previous logic: Interest is calculated on the balance at start of month.
    // Early repayments reduce the balance for the NEXT month.
    
    // So, we can output Early Repayment rows BEFORE or AFTER the regular payment row?
    // If it happens on the same date, order matters for display.
    // Usually you pay Monthly Payment, THEN you pay Extra.
    // So let's output Regular Payment, THEN Early Repayment(s).
    
    // 1. Calculate Regular Payment details
    let interestPayment = currentBalance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;
    
    if (currentBalance + interestPayment < monthlyPayment) {
        principalPayment = currentBalance;
        monthlyPayment = principalPayment + interestPayment;
    }

    let realPrincipalPayment = principalPayment;
    if (realPrincipalPayment > currentBalance) {
        realPrincipalPayment = currentBalance;
    }

    currentBalance -= realPrincipalPayment;
    
    schedule.push({
      number: i,
      date: periodEnd,
      amount: realPrincipalPayment + interestPayment,
      principal: realPrincipalPayment,
      interest: interestPayment,
      balance: Math.max(0, currentBalance),
      type: 'regular'
    });

    if (currentBalance < 0.01) {
        currentBalance = 0;
        // Don't break yet, check for early repayments on this date? 
        // If balance is 0, early repayment is not possible/needed.
        // But maybe the user added it?
        // Let's stop if balance is 0.
    }

    // 2. Apply Early Repayments
    let totalEarlyRepayment = 0;
    let shouldReducePayment = false;

    events.forEach(e => {
        if (currentBalance > 0.01) {
            let amount = e.amount;
            if (amount > currentBalance) {
                amount = currentBalance;
            }
            
            currentBalance -= amount;
            totalEarlyRepayment += amount;
            
            if (e.recalcType === 'reduce_payment') {
                shouldReducePayment = true;
            }

            schedule.push({
                number: '', // No number for extra payment? or same number?
                date: e.date, // Use actual event date
                amount: amount,
                principal: amount,
                interest: 0,
                balance: Math.max(0, currentBalance),
                type: 'early_repayment',
                earlyRepaymentId: e.id // Pass ID for deletion
            });
        }
    });

    // Recalculate if needed
    if (totalEarlyRepayment > 0 && currentBalance > 0.01) {
        if (shouldReducePayment) {
            const remainingMonths = initialMonths - i;
            if (remainingMonths > 0) {
                monthlyPayment = calculateAnnuity(currentBalance, remainingMonths, monthlyRate);
            }
        }
    }

    if (currentBalance < 0.01) {
        currentBalance = 0;
        break;
    }

    i++;
  }
  
  return schedule;
};
