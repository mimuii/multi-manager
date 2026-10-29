// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract MultiManagedAccess {
    uint256 public constant MIN_MANAGERS = 3;

    address public owner;
    address[] public managers;
    mapping(address => bool) public isManager;
    mapping(address => bool) public confirmed;

    constructor(address _owner, address[] memory _managers) {
        require(_managers.length >= MIN_MANAGERS, "At least 3 managers required");
        owner = _owner;
        for (uint256 i = 0; i < _managers.length; i++) {
            address m = _managers[i];
            require(m != address(0), "Invalid manager address");
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
        // 실행 후 confirm 초기화: 다음 변경 때 다시 모든 manager의 confirm 필요
        for (uint256 i = 0; i < managers.length; i++) {
            confirmed[managers[i]] = false;
        }
    }

    function confirm() external onlyManager {
        confirmed[msg.sender] = true;
    }

    function getManagers() external view returns (address[] memory) {
        return managers;
    }
}
