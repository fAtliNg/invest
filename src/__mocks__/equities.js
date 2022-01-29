import { v4 as uuid } from 'uuid';

export const equities = [
  {
    id: uuid(),
    name: 'Globaltrans Inv',
    price: 524,
    maxPrice: 533.05,
    minPrice: 414.00,
    diff: 2.1,
    diffPercent: 0.4,
  },
  {
    id: uuid(),
    name: 'HeadHunter ADR',
    price: 3306,
    maxPrice: 3360,
    minPrice: 3130,
    diff: 38,
    diffPercent: 1.16,
  },
  {
    id: uuid(),
    name: 'OK Rusal MKPAO',
    price: 72.09,
    maxPrice: 73.385,
    minPrice: 71.67,
    diff: -0.55,
    diffPercent: -0.76,
  },
  {
    id: uuid(),
    name: 'Ozon',
    price: 1393.5,
    maxPrice: 1494,
    minPrice: 1362,
    diff: -29,
    diffPercent: -2.04,
  },
  {
    id: uuid(),
    name: 'Petropavlovsk',
    price: 15.48,
    maxPrice: 16.13,
    minPrice: 15.1,
    diff: -0.63,
    diffPercent: -3.91,
  },
];
