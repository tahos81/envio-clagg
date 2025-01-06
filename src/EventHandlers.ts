/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  Clagg,
  Clagg_Compound,
  Clagg_Deposit,
  Clagg_Withdraw,
  Protocol,
  AccountPosition,
  HistoricalAccountPosition,
} from "generated";

const poolToProtocol: { [key: string]: Protocol } = {
  "0x1af23bd57c62a99c59ad48236553d0dd11e49d2d": "VENUS",
  "0x1fa916c27c7c2c4602124a14c77dbb40a5ff1be8": "VENUS",
  "0x69cda960e3b20dfd480866fffd377ebe40bd0a46": "VENUS",
  "0x697a70779c1a03ba2bd28b7627a902bff831b616": "VENUS",
  "0x84064c058f2efea4ab648bb6bd7e40f83ffde39a": "VENUS",
  "0xd6cd2c0fc55936498726cacc497832052a9b2d1b": "AAVE",
  "0x12e7a9423d9128287e63017ee6d1f20e1c237f15": "SYNCSWAP",
};

// Helper function to get protocol
function getProtocol(pool: string): Protocol {
  return poolToProtocol[pool.toLowerCase()] || "UNKNOWN";
}

Clagg.Compound.handler(async ({ event, context }) => {
  const entity: Clagg_Compound = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    pool: event.params.pool,
    rewardAmount: event.params.rewardAmount,
    incentiveAmount: event.params.incentiveAmount,
    liquidityAdded: event.params.liquidityAdded,
    timestamp: BigInt(event.block.timestamp),
  };

  context.Clagg_Compound.set(entity);
});

Clagg.Deposit.handler(async ({ event, context }) => {
  const account = event.params.user;
  const pool = event.params.pool;
  const amount = event.params.amount;
  const shares = event.params.shares;
  const protocol: Protocol = getProtocol(pool);
  const timestamp = BigInt(event.block.timestamp);

  const depositEntity: Clagg_Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: account,
    pool: pool,
    amount: amount,
    shares: shares,
    timestamp: timestamp,
  };

  context.Clagg_Deposit.set(depositEntity);

  const positionId = `${account}_${protocol}_${pool}`;
  const existingPosition = await context.AccountPosition.get(positionId);

  const newPosition: AccountPosition = {
    id: positionId,
    account: account,
    protocol: protocol,
    pool: pool,
    shares: (existingPosition?.shares || BigInt(0)) + shares,
    deposited: (existingPosition?.deposited || BigInt(0)) + amount,
    withdrawn: existingPosition?.withdrawn || BigInt(0),
  };
  context.AccountPosition.set(newPosition);

  const historicalPositionId = `${positionId}_${timestamp}`;
  const historicalPosition: HistoricalAccountPosition = {
    id: historicalPositionId,
    account: account,
    protocol: protocol,
    pool: pool,
    shares: newPosition.shares,
    deposited: newPosition.deposited,
    withdrawn: newPosition.withdrawn,
    timestamp: timestamp,
  };
  context.HistoricalAccountPosition.set(historicalPosition);
});

Clagg.Withdraw.handler(async ({ event, context }) => {
  const account = event.params.user;
  const pool = event.params.pool;
  const amount = event.params.amount;
  const shares = event.params.shares;
  const protocol: Protocol = getProtocol(pool);
  const timestamp = BigInt(event.block.timestamp);

  const entity: Clagg_Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: account,
    pool: pool,
    amount: amount,
    shares: shares,
    timestamp: timestamp,
  };

  context.Clagg_Withdraw.set(entity);

  const positionId = `${account}_${protocol}_${pool}`;
  const existingPosition = await context.AccountPosition.get(positionId);

  if (!existingPosition) {
    throw new Error(`No existing position found for ${positionId}`);
  }

  const newPosition: AccountPosition = {
    id: positionId,
    account: account,
    protocol: protocol,
    pool: pool,
    shares: existingPosition.shares - shares,
    deposited: existingPosition.deposited,
    withdrawn: existingPosition.withdrawn + amount,
  };
  context.AccountPosition.set(newPosition);

  const historicalPositionId = `${positionId}_${timestamp}`;
  const historicalPosition: HistoricalAccountPosition = {
    id: historicalPositionId,
    account: account,
    protocol: protocol,
    pool: pool,
    shares: newPosition.shares,
    deposited: newPosition.deposited,
    withdrawn: newPosition.withdrawn,
    timestamp: timestamp,
  };
  context.HistoricalAccountPosition.set(historicalPosition);
});
