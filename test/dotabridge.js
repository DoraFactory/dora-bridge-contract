const crypto = require("crypto");

const DoraBridge = artifacts.require("DoraBridge");
const InfiniteToken = artifacts.require("InfiniteToken");

const zeroAddr = "0x0000000000000000000000000000000000000001";
const zeroHash =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const allowance = "0xffffffffffffffffffffffffffffffffffffffff";

const toWei = (n) => (BigInt(n * 1e8) * BigInt(1e10)).toString();

contract("DoraBridge", (accounts) => {
  it("should has a admin", async () => {
    const doraBridgeInstance = await DoraBridge.deployed();

    assert.equal(
      await doraBridgeInstance.admin.call(),
      accounts[0],
      "Admin error"
    );

    await doraBridgeInstance.changeAdmin(accounts[5]);

    assert.equal(
      await doraBridgeInstance.admin.call(),
      accounts[5],
      "Change Admin error"
    );
  });

  it("should has a reasonable minimum input amount", async () => {
    const doraBridgeInstance = await DoraBridge.deployed();
    const balance = await doraBridgeInstance.amountThreshold.call();

    assert.equal(balance.valueOf(), 1e17, "0.1 wasn't a threshold");
  });

  it("should correctly record the information submitted", async () => {
    const tokenInstance = await InfiniteToken.new(toWei(100));
    const doraBridgeInstance = await DoraBridge.new(
      tokenInstance.address,
      accounts[0]
    );

    assert.equal(
      await doraBridgeInstance.token.call(),
      tokenInstance.address,
      "ERC20 token address error"
    );

    const user = accounts[2];
    const votaAddr = accounts[3];

    assert.equal(
      await tokenInstance.balanceOf.call(user),
      1e20,
      "User initial balance error"
    );

    assert.equal(
      await tokenInstance.balanceOf.call(zeroAddr),
      1e20,
      "Zero address initial balance error"
    );

    await tokenInstance.approve(doraBridgeInstance.address, allowance, {
      from: user,
    });
    assert.equal(
      (
        await tokenInstance.allowance.call(user, doraBridgeInstance.address)
      ).toString("hex"),
      allowance.slice(2),
      "User allowance error"
    );

    await doraBridgeInstance.submit(toWei(40), votaAddr, {
      from: user,
    });

    assert.equal(
      (await tokenInstance.balanceOf.call(user)).toString(),
      toWei(60),
      "User finnal balance error"
    );
    assert.equal(
      (await tokenInstance.balanceOf.call(zeroAddr)).toString(),
      toWei(140),
      "Zero address finnal balance error"
    );

    assert.equal(
      (await doraBridgeInstance.processedRecords.call()).toNumber(),
      0,
      "Processed records count error"
    );

    assert.equal(
      (await doraBridgeInstance.totalRecords.call()).toNumber(),
      1,
      "Total records count error"
    );

    assert.sameMembers(
      await doraBridgeInstance.record.call("0"),
      [toWei(40), votaAddr, zeroHash],
      "User record error"
    );

    const recordList = await doraBridgeInstance.recordOf.call(user);
    assert.lengthOf(recordList, 1, "User record list length error");
    assert.sameMembers(
      recordList[0],
      [toWei(40), votaAddr, zeroHash],
      "User record list error"
    );
  });

  it("should correctly process the submitted records", async () => {
    const tokenInstance = await InfiniteToken.new(toWei(100));
    const doraBridgeInstance = await DoraBridge.new(
      tokenInstance.address,
      accounts[0]
    );

    const user1 = {
      addr: accounts[2],
      vota: accounts[3],
    };
    const user2 = {
      addr: accounts[4],
      vota: accounts[5],
    };

    /**
     * approve
     */
    await tokenInstance.approve(doraBridgeInstance.address, allowance, {
      from: user1.addr,
    });
    await tokenInstance.approve(doraBridgeInstance.address, allowance, {
      from: user2.addr,
    });

    /**
     * 3 records
     */
    await doraBridgeInstance.submit(toWei(13), user1.vota, {
      from: user1.addr,
    });
    await doraBridgeInstance.submit(toWei(23), user1.vota, {
      from: user1.addr,
    });
    await doraBridgeInstance.submit(toWei(37), user2.vota, {
      from: user2.addr,
    });

    assert.equal(
      (await doraBridgeInstance.processedRecords.call()).toNumber(),
      0,
      "Processed records count error"
    );

    assert.equal(
      (await doraBridgeInstance.totalRecords.call()).toNumber(),
      3,
      "Total records count error"
    );

    const unprocessedRecords =
      await doraBridgeInstance.getUnprocessedRecords.call(100);
    assert.equal(
      unprocessedRecords.size,
      3,
      "Unprocessed record list size error"
    );
    assert.lengthOf(
      unprocessedRecords.records,
      3,
      "Unprocessed record list length error"
    );
    assert.sameMembers(
      unprocessedRecords.records[2],
      [toWei(37), user2.vota, zeroHash],
      "Unprocessed record list error"
    );

    const recordList = await doraBridgeInstance.recordOf.call(user1.addr);
    assert.lengthOf(recordList, 2, "User record list length error");
    assert.sameMembers(
      recordList[1],
      [toWei(23), user1.vota, zeroHash],
      "User record list error"
    );

    const fakeTxHash = "0x" + crypto.randomBytes(32).toString("hex");
    await doraBridgeInstance.process(fakeTxHash, 3, { from: accounts[0] });

    assert.equal(
      (await doraBridgeInstance.processedRecords.call()).toNumber(),
      3,
      "Processed records count after process error"
    );

    const newRecordList = await doraBridgeInstance.recordOf.call(user1.addr);
    assert.sameMembers(
      newRecordList[0],
      [toWei(13), user1.vota, fakeTxHash],
      "User1 record after process error"
    );

    const newUser2RecordList = await doraBridgeInstance.recordOf.call(
      user2.addr
    );
    assert.lengthOf(newUser2RecordList, 1, "User2 record list length error");
    assert.sameMembers(
      newUser2RecordList[0],
      [toWei(37), user2.vota, fakeTxHash],
      "User2 record after process error"
    );
  });
});
