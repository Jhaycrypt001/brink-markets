import { isBinaryMarket, SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
const indexerUrl = process.env.SOMNIA_INDEXER_URL ?? "https://dev.smk.somnia.host/v1/graphql";
const wsRpcUrl = process.env.SOMNIA_WS_RPC_URL ?? "wss://api.infra.testnet.somnia.network/ws";
const privateKey = process.env.BRINK_TEST_PRIVATE_KEY;
const confirmTrade = process.env.BRINK_CONFIRM_TRADE === "YES";
const requestedAmount = Number(process.env.BRINK_TEST_AMOUNT ?? "1");
if (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error("Set BRINK_TEST_PRIVATE_KEY to a funded Shannon test wallet key locally; never paste it into chat or commit it.");
}
if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || requestedAmount > 10) {
    throw new Error("BRINK_TEST_AMOUNT must be a number greater than 0 and no greater than 10.");
}
const exchange = new SomniaMarkets({
    indexerUrl,
    wsRpcUrl,
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    privateKey: privateKey
});
const markets = await exchange.loadMarkets(true);
const now = Date.now() / 1_000;
const candidates = [];
for (const market of Object.values(markets)) {
    if (market.type !== "binary" || !market.active || !market.outcomes?.[0] || !isBinaryMarket(market.info))
        continue;
    const binary = market.info;
    const expiry = Number(binary.expiry);
    if (expiry - now < 300)
        continue;
    const book = await exchange.fetchOrderBook(market.outcomes[0].symbol, 5);
    const ask = book.asks[0]?.[0];
    if (ask === undefined)
        continue;
    const onchain = await exchange.client.getMarketOnchain(binary.marketId);
    if (onchain.status !== 1)
        continue;
    const amount = exchange.amountToPrecision(market.outcomes[0].symbol, requestedAmount);
    const price = exchange.priceToPrecision(market.outcomes[0].symbol, ask);
    if (amount <= 0 || price <= 0 || price >= 1)
        continue;
    candidates.push({ market, outcome: market.outcomes[0], expiry, book, onchain, amount, price });
    if (candidates.length >= 5)
        break;
}
if (candidates.length === 0)
    throw new Error("No live binary market with expiry headroom and an ask was found.");
const chosen = candidates[0];
const balance = await exchange.fetchBalance();
const balanceSummary = Object.fromEntries(Object.entries(balance).slice(0, 10).map(([key, value]) => [key, { free: value.free, total: value.total }]));
console.log(JSON.stringify({
    phase: "preflight",
    chainId: somniaShannon.id,
    marketId: chosen.market.info.marketId,
    symbol: chosen.outcome.symbol,
    outcome: chosen.outcome.label,
    amount: chosen.amount,
    limitPrice: chosen.price,
    bestAsk: chosen.book.asks[0]?.[0],
    secondsLeft: Math.round(chosen.expiry - now),
    onchainStatus: chosen.onchain.status,
    balance: balanceSummary,
    willBroadcast: confirmTrade
}, null, 2));
if (!confirmTrade) {
    console.log("Preflight complete. Set BRINK_CONFIRM_TRADE=YES locally to authorize one IOC test order.");
    process.exit(0);
}
const chosenBinary = chosen.market.info;
const refreshed = await exchange.client.getMarketOnchain(chosenBinary.marketId);
if (refreshed.status !== 1)
    throw new Error("Market stopped trading during preflight; refusing to send.");
const finalBook = await exchange.fetchOrderBook(chosen.outcome.symbol, 1);
const finalAsk = finalBook.asks[0]?.[0];
if (finalAsk === undefined)
    throw new Error("Ask disappeared during preflight; refusing to send.");
const finalPrice = exchange.priceToPrecision(chosen.outcome.symbol, finalAsk);
const order = await exchange.createOrder(chosen.outcome.symbol, "limit", "buy", chosen.amount, finalPrice, { timeInForce: "IOC" });
const receipt = order.info.receipt;
console.log(JSON.stringify({
    phase: "broadcasted",
    marketId: chosenBinary.marketId,
    symbol: chosen.outcome.symbol,
    amount: chosen.amount,
    price: finalPrice,
    orderId: order.id,
    transactionHash: receipt?.transactionHash,
    receiptStatus: receipt?.status
}, null, 2));
