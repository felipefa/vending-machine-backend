export function getChangeInCoins(change: number) {
  const coins = [100, 50, 20, 10, 5];
  const result = [];

  for (const coin of coins) {
    while (change >= coin) {
      result.push(coin);
      change -= coin;
    }
  }

  return result;
}
