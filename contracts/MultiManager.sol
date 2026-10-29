// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiManager {
    address[] public managers;
    mapping(address => bool) public isManager;
    mapping(address => bool) public confirmed;

    uint256 public rewardPerBlock;

    constructor(address[] memory _managers) {
        require(_managers.length >= 3, "At least 3 managers required");
        for (uint256 i = 0; i < _managers.length; i++) {
            address m = _managers[i];
            require(m != address(0), "Invalid manager");
            require(!isManager[m], "Duplicate manager");
            isManager[m] = true;
            managers.push(m);
        }
    }

    modifier onlyManager() {
        require(isManager[msg.sender], "You are not a manager");
        _;
    }

    modifier onlyAllConfirmed() {
        require(isManager[msg.sender], "You are not a manager");
        for (uint256 i = 0; i < managers.length; i++) {
            require(confirmed[managers[i]], "Not all confirmed yet");
        }
        _;
        // 실행 후 confirm 초기화 (다음 변경 시 다시 모두의 confirm 필요)
        for (uint256 i = 0; i < managers.length; i++) {
            confirmed[managers[i]] = false;
        }
    }

    function getManagerCount() external view returns (uint256) {
        return managers.length;
    }

    function confirm() external onlyManager {
        confirmed[msg.sender] = true;
    }

    function setRewardPerBlock(uint256 _amount) external onlyAllConfirmed {
        rewardPerBlock = _amount;
    }
}
