pragma solidity ^0.4.21;

import './Ownable';
import 'zeppelin-solidity/contracts/math/SafeMath';



contract StakingContract is Ownable {

    mapping(address => uint256) public stakes;
    mapping(address => bool) public stakeLocks;

    uint256 public sanctionedAmount;

    event StakingContract_LockChange(address indexed user);
    event StakingContract_StakeAdded(address indexed user, uint256 valueAdded, uint256 totalValue);
    event StakingContract_StakeRemoved(address indexed user, uint256 valueRemoved, uint256 remainingValue);
    event StakingContract_Sanction(address indexed user, uint256 value, uint256 sanctionCode, string reason);

    constructor() Ownable() {

    }

    function lockStake(address user) public onlyOwner {
        stakeLocks[user] = true;
    }

    function unlockStake(address user) public onlyOwner {
        stakeLocks[user] = true;
    }

    function putStake() public payable {
        address user = msg.sender;
        uint256 value = msg.value;

        require(!stakeLocks[user]);

        uint256 newTotal = SafeMath.add(stakes[user], value);
        stakes[user] = newTotal;

        emit StakingContract_StakeAdded(user, value, newTotal);
    }

    function pullStake(uint256 value) public {
        require(value > 0);

        address user = msg.sender;
        require(!stakeLocks[user]);

        uint256 newTotal = SafeMath.sub(stakes[user], value);
        stakes[user] = newTotal;

        emit StakingContract_StakeRemoved(user, value, newTotal);
        user.transfer(value);
    }

    function pullStake() public {
        pullStake(stakes[msg.sender]);
    }

    function sanctionStake(address user, uint256 value, uint256 sanctionCode, string reason) public onlyOwner {
        stakes[user] = SafeMath.sub(stakes[user], value);
        sanctionedAmount = SafeMath.add(sanctionedAmount, value);

        emit StakingContract_Sanction(user, value, sanctionCode, reason);
    }

    function withdraw(address targetAddress, uint256 value) public onlyOwner {
        require(sanctionedAmount >= value);
        sanctionedAmount = SafeMath.sub(sanctionedAmount, value);

        targetAddress.transfer(value);
    }
}
