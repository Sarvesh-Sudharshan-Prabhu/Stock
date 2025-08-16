// Standard Normal Cumulative Distribution Function (CDF) approximation
// Uses the Abramowitz and Stegun approximation
function standardNormalCdf(x: number): number {
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c2 = 0.39894228; // 1 / sqrt(2 * PI)

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return (
      1.0 -
      c2 *
        Math.exp((-x * x) / 2.0) *
        t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  } else {
    const t = 1.0 / (1.0 - p * x);
    return (
      c2 *
      Math.exp((-x * x) / 2.0) *
      t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  }
}

interface BlackScholesInput {
  stockPrice: number; // S
  strikePrice: number; // K
  timeToMaturity: number; // T (in years)
  riskFreeRate: number; // r
  volatility: number; // sigma
}

export function calculateBlackScholes({
  stockPrice,
  strikePrice,
  timeToMaturity,
  riskFreeRate,
  volatility,
}: BlackScholesInput): { callPrice: number; putPrice: number } {
  if (timeToMaturity <= 0 || volatility <= 0) {
    return { callPrice: 0, putPrice: 0 };
  }

  const d1 =
    (Math.log(stockPrice / strikePrice) +
      (riskFreeRate + (volatility * volatility) / 2) * timeToMaturity) /
    (volatility * Math.sqrt(timeToMaturity));
  const d2 = d1 - volatility * Math.sqrt(timeToMaturity);

  const nD1 = standardNormalCdf(d1);
  const nD2 = standardNormalCdf(d2);

  const callPrice =
    stockPrice * nD1 -
    strikePrice * Math.exp(-riskFreeRate * timeToMaturity) * nD2;

  const nMinusD1 = standardNormalCdf(-d1);
  const nMinusD2 = standardNormalCdf(-d2);

  const putPrice =
    strikePrice * Math.exp(-riskFreeRate * timeToMaturity) * nMinusD2 -
    stockPrice * nMinusD1;

  return { callPrice, putPrice };
}
