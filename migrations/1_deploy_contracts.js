const InfiniteToken = artifacts.require("InfiniteToken");
const DoraBridge = artifacts.require("DoraBridge");

module.exports = async function (deployer, _, accounts) {
  await deployer.deploy(
    InfiniteToken,
    (10n ** 22n).toString() /** 10000 ether */,
    { overwrite: false }
  );

  const tokenInstance = await InfiniteToken.deployed();

  await deployer.deploy(DoraBridge, tokenInstance.address, accounts[0]);
};
