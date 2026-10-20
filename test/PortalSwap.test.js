const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PortalSwap AMM", function () {
  let deployer, alice;
  let wpot, factory, router, tokenA, tokenB;

  const E18 = (n) => ethers.parseUnits(n.toString(), 18);
  const E6 = (n) => ethers.parseUnits(n.toString(), 6);

  beforeEach(async function () {
    [deployer, alice] = await ethers.getSigners();

    const WPOT = await ethers.getContractFactory("WPOT");
    wpot = await WPOT.deploy();
    await wpot.waitForDeployment();

    const Factory = await ethers.getContractFactory("PortalSwapFactory");
    factory = await Factory.deploy(deployer.address);
    await factory.waitForDeployment();

    const Router = await ethers.getContractFactory("PortalSwapRouter");
    router = await Router.deploy(await factory.getAddress(), await wpot.getAddress());
    await router.waitForDeployment();

    const Mock = await ethers.getContractFactory("MockERC20");
    tokenA = await Mock.deploy("Token A", "TKA", 18, E18(1000000));
    await tokenA.waitForDeployment();
    tokenB = await Mock.deploy("Token B", "TKB", 18, E18(1000000));
    await tokenB.waitForDeployment();

    // Give alice some tokens
    await tokenA.faucet(alice.address, E18(10000));
    await tokenB.faucet(alice.address, E18(10000));
  });

  it("creates a pair and reports it from the factory", async function () {
    const a = await tokenA.getAddress();
    const b = await tokenB.getAddress();
    await factory.createPair(a, b);
    expect(await factory.getPair(a, b)).to.not.equal(ethers.ZeroAddress);
    expect(await factory.allPairsLength()).to.equal(1n);
  });

  it("adds liquidity and mints LP tokens", async function () {
    const a = await tokenA.getAddress();
    const b = await tokenB.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    await tokenA.approve(await router.getAddress(), E18(1000));
    await tokenB.approve(await router.getAddress(), E18(1000));
    await router.addLiquidity(a, b, E18(1000), E18(1000), 0, 0, deployer.address, deadline);

    const pairAddr = await factory.getPair(a, b);
    const pair = await ethers.getContractAt("PortalSwapPair", pairAddr);
    const [r0, r1] = await pair.getReserves();
    expect(r0).to.equal(E18(1000));
    expect(r1).to.equal(E18(1000));

    // MINIMUM_LIQUIDITY of 1000 wei is locked to 0xdead
    const total = await pair.totalSupply();
    expect(total).to.be.greaterThan(0n);
    const lp = await pair.balanceOf(deployer.address);
    expect(lp).to.be.greaterThan(0n);
  });

  it("swaps tokens and charges the 0.3% fee", async function () {
    const a = await tokenA.getAddress();
    const b = await tokenB.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    await tokenA.approve(await router.getAddress(), E18(1000));
    await tokenB.approve(await router.getAddress(), E18(1000));
    await router.addLiquidity(a, b, E18(1000), E18(1000), 0, 0, deployer.address, deadline);

    const before = await tokenB.balanceOf(deployer.address);
    await tokenA.approve(await router.getAddress(), E18(100));
    await router.swapExactTokensForTokens(E18(100), 0, [a, b], deployer.address, deadline);
    const after = await tokenB.balanceOf(deployer.address);

    const out = after - before;
    // 100 in against a 1000/1000 pool => ~90.33 out after the 0.3% fee
    expect(out).to.be.greaterThan(E18(90));
    expect(out).to.be.lessThan(E18(91));

    // A 100 in / 90.33 out swap must not break the invariant
    const pairAddr = await factory.getPair(a, b);
    const pair = await ethers.getContractAt("PortalSwapPair", pairAddr);
    const [r0, r1] = await pair.getReserves();
    expect(r0 * r1).to.be.greaterThanOrEqual(1000n * 1000n * 10n ** 36n);
  });

  it("removes liquidity and returns both tokens", async function () {
    const a = await tokenA.getAddress();
    const b = await tokenB.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    await tokenA.approve(await router.getAddress(), E18(500));
    await tokenB.approve(await router.getAddress(), E18(500));
    await router.addLiquidity(a, b, E18(500), E18(500), 0, 0, deployer.address, deadline);

    const pairAddr = await factory.getPair(a, b);
    const pair = await ethers.getContractAt("PortalSwapPair", pairAddr);
    const lpBalance = await pair.balanceOf(deployer.address);

    await pair.approve(await router.getAddress(), lpBalance);
    const balA = await tokenA.balanceOf(deployer.address);
    await router.removeLiquidity(a, b, lpBalance, 0, 0, deployer.address, deadline);

    expect(await tokenA.balanceOf(deployer.address)).to.be.greaterThan(balA);
    expect(await pair.balanceOf(deployer.address)).to.equal(0n);
  });

  it("swaps native POT through WPOT", async function () {
    const b = await tokenB.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    await tokenB.approve(await router.getAddress(), E18(1000));
    await router.addLiquidityPOT(b, E18(1000), 0, 0, deployer.address, deadline, {
      value: E18(1000),
    });

    const before = await tokenB.balanceOf(deployer.address);
    await router.swapExactPOTForTokens(0, [await wpot.getAddress(), b], deployer.address, deadline, {
      value: E18(10),
    });
    expect(await tokenB.balanceOf(deployer.address)).to.be.greaterThan(before);
  });

  it("reverts a swap that would break the invariant", async function () {
    const a = await tokenA.getAddress();
    const b = await tokenB.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    await tokenA.approve(await router.getAddress(), E18(1000));
    await tokenB.approve(await router.getAddress(), E18(1000));
    await router.addLiquidity(a, b, E18(1000), E18(1000), 0, 0, deployer.address, deadline);

    const pairAddr = await factory.getPair(a, b);
    const pair = await ethers.getContractAt("PortalSwapPair", pairAddr);

    // Directly calling pair.swap with no input must revert (K / INSUFFICIENT_INPUT_AMOUNT)
    await expect(pair.swap(E18(10), 0, deployer.address, "0x")).to.be.reverted;
  });
});
