// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// These files are dynamically created at test time

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/DoraBridge.sol";

contract TestDoraBridge {
    function testInitialThreshold() public {
        DoraBridge bridge = DoraBridge(DeployedAddresses.DoraBridge());

        uint256 expected = 0.1 ether;

        Assert.equal(
            bridge.amountThreshold(),
            expected,
            "Owner should have 0.1 threshold"
        );
    }
}
