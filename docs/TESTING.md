# Backend Testing

## 1. Build

```powershell
npm install --ignore-scripts
npm run build:api
```

## 2. Start a live Shannon read-only server

The public DreamDEX endpoints are sufficient for market discovery. This does not require a wallet and does not place an order.

```powershell
$env:SOMNIA_INDEXER_URL='https://dev.smk.somnia.host/v1/graphql'
$env:SOMNIA_WS_RPC_URL='wss://api.infra.testnet.somnia.network/ws'
node apps/api/dist/server.js
```

Expected startup log:

```text
Server listening at http://127.0.0.1:8787
```

## 3. Verify liveness

In a second terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
```

Expected shape:

```json
{"ok":true,"service":"brink-api","requestId":"req-1"}
```

## 4. Verify live DreamDEX discovery

```powershell
Invoke-RestMethod 'http://127.0.0.1:8787/v1/markets?limit=10'
```

The response must contain:

- `meta.count` greater than zero when testnet has live markets.
- A real `marketId` and outcome `symbol`.
- `status` derived from on-chain state.
- Numeric bid/ask levels that serialize as JSON.
- `score`, `reasons`, and `tradeable` fields.

## 5. Verify query and detail behavior

```powershell
Invoke-RestMethod 'http://127.0.0.1:8787/v1/markets?asset=BTC&tradeableOnly=true&limit=5'
Invoke-RestMethod 'http://127.0.0.1:8787/v1/markets/<market-id>'
```

Invalid input must return `400 INVALID_QUERY`; an unknown ID must return `404 MARKET_NOT_FOUND`.

## 6. What this test proves

This read-only smoke test proves the full backend path:

```text
DreamDEX indexer -> markets-sdk -> on-chain status -> order book -> normalization -> scoring -> HTTP JSON
```

It does not prove wallet signing, order placement, redemption, or production RPC capacity. Those are separate explicitly approved testnet stages.

## 8. Wallet and one-order test

Use a disposable Shannon test wallet funded only with faucet assets. Set the private key in the local process environment; never put it in chat, source files, `.env` committed to Git, screenshots, or logs.

```powershell
$env:BRINK_TEST_PRIVATE_KEY='0x<64-hex-character-test-key>'
$env:BRINK_TEST_AMOUNT='1'
npm run build:api
npm run testnet:wallet
```

The first run is read-only and prints the selected market, on-chain status, amount, price, seconds left, and wallet balance. It does not broadcast.

After reviewing that output, the explicit broadcast command is:

```powershell
$env:BRINK_CONFIRM_TRADE='YES'
npm run testnet:wallet
```

This sends one small, limit IOC buy at the freshly-read ask. The runner rechecks on-chain status and the order book immediately before sending. It prints the full transaction hash and receipt status returned by the SDK. Remove `BRINK_CONFIRM_TRADE` immediately after the test.

This verifies wallet-backed SDK signing, precision/lot handling, on-chain status gating, order submission, receipt extraction, and JSON-safe reporting. It does not perform redemption automatically; redemption should be a separate test after the market finalizes.

## 7. Known local limitation

This managed Windows sandbox blocks child-process spawning for Vitest/Vite and esbuild with `spawn EPERM`. TypeScript compilation, direct scoring smoke tests, Fastify in-process injection, and the live Shannon HTTP smoke test all run successfully.
