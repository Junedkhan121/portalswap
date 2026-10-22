// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title tPotStaking
 * @dev Native tPOTv3 staking vault.
 *
 *  tPOTv3 is the NATIVE gas token of the Portaldot V3 Testnet (like ETH on
 *  Ethereum) — NOT an ERC-20.  Users stake by sending tPOTv3 with the call;
 *  no approve step is needed.
 *
 *  No rewards in v1 — this contract tracks TVL and individual balances as a
 *  foundation for future reward mechanisms.
 *
 *  Compile with evmVersion "paris" (no PUSH0) for Portaldot V3 WASM-EVM.
 */
contract tPotStaking {

    // ── State ────────────────────────────────────────────────────────────
    uint256 public totalStaked;
    mapping(address => uint256) public stakedBalance;

    // ── Events ───────────────────────────────────────────────────────────
    event Staked(address indexed user, uint256 amount, uint256 newTotal);
    event Withdrawn(address indexed user, uint256 amount, uint256 newTotal);

    // ── Stake ────────────────────────────────────────────────────────────

    /**
     * @notice Stake tPOTv3. Send the amount you want to stake as msg.value.
     *         No approve() required — this is a native token.
     */
    function stake() external payable {
        require(msg.value > 0, "tPotStaking: zero amount");
        stakedBalance[msg.sender] += msg.value;
        totalStaked              += msg.value;
        emit Staked(msg.sender, msg.value, totalStaked);
    }

    // ── Withdraw ─────────────────────────────────────────────────────────

    /**
     * @notice Unstake `amount` tPOTv3 and return it to the caller's wallet.
     * @param  amount  Amount in wei (18 decimals) to withdraw.
     */
    function withdraw(uint256 amount) external {
        require(amount > 0,                          "tPotStaking: zero amount");
        require(stakedBalance[msg.sender] >= amount, "tPotStaking: insufficient balance");

        // Effects before interaction (CEI)
        stakedBalance[msg.sender] -= amount;
        totalStaked               -= amount;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "tPotStaking: transfer failed");

        emit Withdrawn(msg.sender, amount, totalStaked);
    }

    // ── View helpers ─────────────────────────────────────────────────────

    /// @notice tPOTv3 held by this contract (should equal totalStaked).
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
