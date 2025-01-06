import assert from "assert";
import { 
  TestHelpers,
  Clagg_Compound
} from "generated";
const { MockDb, Clagg } = TestHelpers;

describe("Clagg contract Compound event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Clagg contract Compound event
  const event = Clagg.Compound.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("Clagg_Compound is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await Clagg.Compound.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualClaggCompound = mockDbUpdated.entities.Clagg_Compound.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedClaggCompound: Clagg_Compound = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      pool: event.params.pool,
      rewardAmount: event.params.rewardAmount,
      incentiveAmount: event.params.incentiveAmount,
      liquidityAdded: event.params.liquidityAdded,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualClaggCompound, expectedClaggCompound, "Actual ClaggCompound should be the same as the expectedClaggCompound");
  });
});
