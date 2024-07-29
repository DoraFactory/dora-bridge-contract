Dora-Bridege

A Unidirectional Bridge for Dora Token from ETH Network to Vota Network

This smart contract is used to assist in the one-way transfer of Dora ERC20 Token to the Cosmos Vota network.

## Main logic

### Sumbit

After approval, the user destroys a certain number of tokens (transfers them to the 0x01 address) through the `submit()` method. The contract is responsible for recording this information

### Process

The centralized administrator confirms the on chain records and ensures that the transfer of the corresponding number of tokens is completed on the Vota network. Update the records in the contract using the `process()` method.

## Feature

- Due to the inability of the contract to perceive information from the Vota network, the contract itself is only responsible for two tasks: destruction and recording in the ETH network.

- Cosmos network accounts use bech32 address format, but they can be converted to bytes20 format through a fixed method before read and write on contract. There is no need to store string type data in the contract.

- The contract cannot monitor whether the administrator has completed the deposit work on time, but the administrator will upload a txhash of the Vota network for users to perform post verification.
