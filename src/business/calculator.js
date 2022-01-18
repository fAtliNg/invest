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

  for (let month = 0; month < investMonthCount; ++month) {
    totalBalance += totalBalance * percentAmountPerMonth;

    if(month % values.periodAmount === 0){
      totalBalance += replenishmentAmount;
      totalReplenishment += replenishmentAmount;
    }
  }

  totalBalance = Math.floor(totalBalance);

  return {
    totalBalance: totalBalance,
    initialAmount: initialAmount,
    totalReplenishmentAmount: totalReplenishment,
    totalPercentAmount: totalBalance - initialAmount - totalReplenishment,
  }
}
