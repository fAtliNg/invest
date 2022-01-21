export const resolve = (values) => {

  const initialAmount = parseInt(values.initialAmount);
  const replenishmentAmount = parseInt(values.replenishmentAmount);
  const numberOfYears = parseInt(values.numberOfYears);
  const percentAmountPerYear = parseInt(values.percentAmountPerYear);

  let totalBalance = initialAmount;
  let totalReplenishment = 0;

  const MONTH_IN_YEAR_COUNT = 12;
  const investMonthCount = numberOfYears * MONTH_IN_YEAR_COUNT;
  const percentAmountPerMonth = (percentAmountPerYear / MONTH_IN_YEAR_COUNT) / 100;

  const details = {
       initialAmounts: [],
       totalPercentAmounts: [],
       totalReplenishmentAmounts: [],
       labels: [],
  }

  for (let month = 0; month < investMonthCount; ++month) {
    totalBalance += totalBalance * percentAmountPerMonth;

    if(month % values.periodAmount === 0){
      totalBalance += replenishmentAmount;
      totalReplenishment += replenishmentAmount;
    }

    if((month + 1) % MONTH_IN_YEAR_COUNT === 0){
      details.initialAmounts.push(initialAmount);
      details.totalPercentAmounts.push(totalBalance - totalReplenishment - initialAmount);
      details.totalReplenishmentAmounts.push(totalReplenishment);
      details.labels.push('Год #' + (details.labels.length + 1));
    }
  }

  totalBalance = Math.floor(totalBalance);

  return {
    summary : {
      totalBalance: totalBalance,
      initialAmount: initialAmount,
      totalReplenishmentAmount: totalReplenishment,
      totalPercentAmount: totalBalance - initialAmount - totalReplenishment,
    },
    details : details,
  }
}
