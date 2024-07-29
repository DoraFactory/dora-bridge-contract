# 操作手册

### 用户提交记录

DoraBridge.submit(uint256 amount, address votaAddr)

> 其中 votaAddr 是需要将 vota 网络的地址通过 [bech32-converting](https://www.npmjs.com/package/bech32-converting) 进行转化。相比于上传储存 String，这样子能节省更多成本，并且避免后续的异常。

- 需要提前执行 approve

- 用户会在这个操作中将 amount 数量的 DORA 转移至 0x01 地址

- 会生成一个新的 record 记录

### 用户查询状态

DoraBridge.recordOf(address user)

- 用户可以查询自己地址关联的 record 记录

  - 使用了无分页的 Array 储存在链上，如果单一用户 record 记录过多这个接口可能无法查询。但是一方面这个情况不应该在正常用户身上发生，另一方面这个接口即使查询出错也不会有任何影响。

- txHash 字段在管理员处理之前均为 0x00

### 管理员执行查询

DoraBridge.getUnprocessedRecords(uint256 maxCount)

- 管理员查询自己未处理过的记录

- 返回 size（可能会小于 maxCount）和具体的 records（包括数量和 vota 地址信息）
  - 其中 vota 地址需要从从 bytes20 类型转化回 bech32 地址

### 管理员提交更新

DoraBridge.process(bytes32 txHash, uint256 count)

- 管理员需要将上一笔查询中的所有转账信息，在 vota 网络的一笔交易里处理完

- 凭借 vota 网络的 txHash 和 count = records.length，提交 process 记录

- 提交后会更新 getUnprocessedRecords 的返回结果，和对应用户 record 下的 txHash 字段
