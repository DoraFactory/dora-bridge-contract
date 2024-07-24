// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ERC20 {
    function decimals() external view returns (uint256);

    function transferFrom(address, address, uint256) external returns (bool);

    function transfer(address, uint256) external returns (bool);
}

contract DoraBridge {
    ERC20 public token;

    address public admin;

    uint256 public amountThreshold = 0.1 ether;

    struct Record {
        uint256 amount;
        address vota;
        bytes32 txHash;
    }

    constructor(ERC20 _token, address _admin) {
        token = _token;
        admin = _admin;
    }

    mapping(uint256 => uint256) private _amounts;
    mapping(uint256 => address) private _votaAddrs;
    mapping(uint256 => uint256) private _txHashIndexes;
    uint256 public totalRecords;
    uint256 public processedRecords;

    bytes32[] private _txHashes;

    mapping(address => uint256[]) private _usersRecords;

    event Submit(
        uint256 indexed idx,
        address indexed eoa,
        address indexed vota,
        uint256 amount
    );

    function changeAdmin(address _admin) public {
        require(msg.sender == admin);
        admin = _admin;
    }

    function record(uint256 _idx) public view returns (Record memory) {
        bytes32 txHash = bytes32(0);
        uint256 txHashIdx = _txHashIndexes[_idx];
        if (txHashIdx > 0 && txHashIdx <= _txHashes.length) {
            txHash = _txHashes[txHashIdx - 1];
        }

        Record memory res = Record(_amounts[_idx], _votaAddrs[_idx], txHash);

        return res;
    }

    function recordOf(
        address _user
    ) public view returns (Record[] memory results) {
        uint256[] storage list = _usersRecords[_user];
        uint256 size = list.length;

        results = new Record[](size);
        for (uint256 i = 0; i < size; i++) {
            results[i] = record(list[i]);
        }
    }

    function getUnprocessedRecords(
        uint256 _count
    ) public view returns (uint256 size, Record[] memory records) {
        size = totalRecords - processedRecords;
        if (size > _count) {
            size = _count;
        }
        records = new Record[](size);

        uint256 idx = processedRecords;
        for (uint256 i = 0; i < size; i++) {
            records[i].amount = _amounts[idx];
            records[i].vota = _votaAddrs[idx];
            idx++;
        }
    }

    function submit(uint256 _amount, address _votaAddr) public {
        require(_amount >= amountThreshold, "amount too low");

        require(
            token.transferFrom(msg.sender, address(1), _amount),
            "transfer error"
        );

        uint256 idx = totalRecords;
        _amounts[idx] = _amount;
        _votaAddrs[idx] = _votaAddr;

        _usersRecords[msg.sender].push(idx);

        totalRecords = idx + 1;

        emit Submit(idx, msg.sender, _votaAddr, _amount);
    }

    function process(bytes32 _txHash, uint256 _count) public {
        require(msg.sender == admin);
        require(_count > 0);
        require(processedRecords + _count <= totalRecords);

        _txHashes.push(_txHash);
        uint256 txHashIdx = _txHashes.length;

        uint256 idx = processedRecords;
        uint256 newProcessedRecords = processedRecords + _count;
        for (; idx < newProcessedRecords; idx++) {
            _txHashIndexes[idx] = txHashIdx;
        }

        processedRecords = newProcessedRecords;
    }
}
