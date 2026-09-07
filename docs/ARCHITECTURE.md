# Brink / EventScout Architecture

## Working title

The repository currently uses **Brink** as a working title. The product concept is EventScout: a market-discovery and execution layer for DreamDEX Event Contracts.

## Product boundary

The backend answers one question reliably:

> Which DreamDEX event-contract markets are live, sufficiently liquid, fresh, and worth presenting to a trader right now?

The backend does not custody funds, hold private keys, or make autonomous trades. Every write is initiated by a user-controlled wallet in the client.

## System shape

```text
DreamDEX / Somnia
        |
        v
MarketSource adapter  --->  normalized BinaryMarket
        |
        v
TTL cache  --->  deterministic scorer  --->  HTTP API
                                             |
                                             v
                                     frontend / embed clients
```

The `MarketSource` port isolates the SDK from the rest of the application. This keeps scoring and HTTP behavior testable with fixtures and allows the DreamDEX SDK client to evolve without leaking SDK-specific shapes into the UI.

## DreamDEX invariants

- Use `@somnia-chain/markets-sdk` `0.29.0` or newer.
- Discover binary markets with `listLiveBinaryMarkets`.
- Before every write, gate on `getMarketOnchain(marketId).status === 1`.
- Fetch a fresh order book immediately before an order.
- Use IOC for taker actions so an unfilled remainder does not rest unexpectedly.
- Use SDK precision helpers for prices and lot sizes.
- Read unified write receipts from `order.info.receipt`.
- Key state by `marketId`; pools are recycled between market windows.
- Settled markets require `listBinaryMarkets({ status: "Finalized" })`; `loadMarkets()` is not a settlement scanner.

## API contract

### `GET /health`

Returns a liveness response.

### `GET /v1/markets`

Returns markets sorted by descending score. Each result includes the normalized market, best bid/ask, spread, seconds remaining, score, tradeability, and human-readable reasons.

The response is intentionally read-only. Order placement remains a wallet-signed client action.

### `GET /v1/markets/:marketId`

Returns one scored live market from the same short-lived snapshot used by the list route. Missing markets return `404 MARKET_NOT_FOUND`; adapter failures return `502 MARKET_SOURCE_UNAVAILABLE`. Every response includes `x-request-id` and the same ID in its JSON metadata/error object.

## Scoring policy

Hard gates:

1. On-chain status must be `Trading`.
2. At least five minutes must remain before expiry.
3. The order book must be fresh.
4. A best ask must exist for a buy flow.

Soft signals:

- Smaller spread.
- More volume.
- More trades.
- Fresh two-sided liquidity.

The score is deterministic and explainable. An LLM may later summarize reasons, but it must never decide whether an order is sent.

## Failure behavior

- Source failures return `502 MARKET_SOURCE_UNAVAILABLE`.
- Empty or stale books remain visible only as non-tradeable diagnostics.
- No route trusts indexer status alone.
- No write endpoint exists in the API service.
- Cache is short-lived to reduce load without hiding fast market changes.

## Security posture

- No private keys in the API process.
- No user balances or wallet identifiers persisted.
- Client must verify chain ID before signing.
- User confirmation is required for every order.
- Errors are logged server-side without secrets or signed payloads.

## Testing strategy

- Unit-test scoring, expiry gates, freshness, spread, and sort order.
- Contract-test `MarketSource` with recorded DreamDEX-shaped fixtures.
- Run one read-only Shannon testnet smoke test.
- Run one manually approved IOC trade with a funded test wallet.
- Verify locked, near-expiry, empty-book, stale-book, and insufficient-balance states.

## Frontend handoff boundary

Backend work is complete when:

- `GET /health` is live.
- `GET /v1/markets` returns normalized scored markets.
- The DreamDEX adapter is wired to the current SDK.
- Unit and adapter contract tests pass.
- A testnet read-only smoke test passes.

At that point the frontend starts. The frontend owner will consume the API, own wallet connection, render market cards, and call the SDK for user-signed orders. No frontend files should be added before this boundary is explicitly announced.

## Planned next backend increments

1. Wire the real SDK client in `server.ts` using environment-backed RPC/indexer/address configuration.
2. Add a market-detail endpoint with a single fresh book snapshot.
3. Add a finalized-market read endpoint for redemption discovery.
4. Add request IDs and structured error codes.
5. Add adapter contract fixtures from Shannon testnet.
