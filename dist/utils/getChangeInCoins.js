"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChangeInCoins = void 0;
function getChangeInCoins(change) {
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
exports.getChangeInCoins = getChangeInCoins;
