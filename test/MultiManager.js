const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiManager - onlyAllConfirmed", function () {
  let mm, manager1, manager2, manager3, nonManager;
  const amount = 100n;

  beforeEach(async function () {
    [manager1, manager2, manager3, nonManager] = await ethers.getSigners();
    const MultiManager = await ethers.getContractFactory("MultiManager");
    mm = await MultiManager.deploy([
      manager1.address,
      manager2.address,
      manager3.address,
    ]);
    await mm.waitForDeployment();
  });

  it("3명 이상의 manager가 등록된다", async function () {
    expect(await mm.getManagerCount()).to.equal(3n);
    expect(await mm.isManager(manager1.address)).to.equal(true);
    expect(await mm.isManager(manager2.address)).to.equal(true);
    expect(await mm.isManager(manager3.address)).to.equal(true);
    expect(await mm.isManager(nonManager.address)).to.equal(false);
  });

  it("manager가 3명 미만이면 배포에 실패한다", async function () {
    const MultiManager = await ethers.getContractFactory("MultiManager");
    await expect(
      MultiManager.deploy([manager1.address, manager2.address])
    ).to.be.revertedWith("At least 3 managers required");
  });

  it("manager가 아닌 주소가 setRewardPerBlock을 호출하면 'You are not a manager' 에러", async function () {
    await expect(
      mm.connect(nonManager).setRewardPerBlock(amount)
    ).to.be.revertedWith("You are not a manager");
  });

  it("manager가 아닌 주소가 confirm을 호출하면 'You are not a manager' 에러", async function () {
    await expect(mm.connect(nonManager).confirm()).to.be.revertedWith(
      "You are not a manager"
    );
  });

  it("아무도 confirm하지 않았으면 'Not all confirmed yet' 에러", async function () {
    await expect(
      mm.connect(manager1).setRewardPerBlock(amount)
    ).to.be.revertedWith("Not all confirmed yet");
  });

  it("일부 manager만 confirm했으면 'Not all confirmed yet' 에러", async function () {
    await mm.connect(manager1).confirm();
    await mm.connect(manager2).confirm();

    await expect(
      mm.connect(manager1).setRewardPerBlock(amount)
    ).to.be.revertedWith("Not all confirmed yet");
  });

  it("모든 manager가 confirm하면 rewardPerBlock이 변경된다", async function () {
    await mm.connect(manager1).confirm();
    await mm.connect(manager2).confirm();
    await mm.connect(manager3).confirm();

    await mm.connect(manager1).setRewardPerBlock(amount);
    expect(await mm.rewardPerBlock()).to.equal(amount);
  });

  it("변경 후 confirm이 초기화되어 다시 모든 confirm이 필요하다", async function () {
    await mm.connect(manager1).confirm();
    await mm.connect(manager2).confirm();
    await mm.connect(manager3).confirm();
    await mm.connect(manager1).setRewardPerBlock(amount);

    expect(await mm.confirmed(manager1.address)).to.equal(false);
    await expect(
      mm.connect(manager1).setRewardPerBlock(200n)
    ).to.be.revertedWith("Not all confirmed yet");
  });
});
