// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title tPotFaucet
 * @dev Drip faucet for native tPOTv3 (the Portaldot V3 Testnet gas token).
 *
 *  KEY DESIGN:
 *   - tPOTv3 is the NATIVE token of the Portaldot V3 Testnet (like ETH on
 *     Ethereum), not an ERC-20.  WPOT is the wrapped ERC-20 version.
 *   - This contract therefore uses plain native-value transfers; no ERC-20
 *     approve/transferFrom is needed to claim or donate.
 *   - claim(recipient) can be called by ANYONE — a user without gas can ask
 *     a friend (or a relay) to call it on their behalf and push tPOTv3 to
 *     their address.  The cooldown is tracked per RECIPIENT, not per caller.
 *   - donate() is payable; anyone can top up the pool at any time.
 *   - Seeded with 1 000 tPOTv3 at construction by the deployer.
 *
 *  SECURITY NOTES:
 *   - No reentrancy risk: state is updated (lastClaimTime) before the
 *     external call, following checks-effects-interactions.
 *   - emergencyWithdraw is owner-only and is the only privileged function.
 *
 *  Compile with evmVersion "paris" (no PUSH0) for Portaldot V3 WASM-EVM.
 */
contract tPotFaucet {
    // ── Constants ────────────────────────────────────────────────────────
    uint256 public constant CLAIM_AMOUNT = 1 ether;  // 1 tPOTv3
    uint256 public constant COOLDOWN     = 72 hours; // per recipient

    // ── State ────────────────────────────────────────────────────────────
    address public owner;

    /// @notice Unix timestamp of the last successful claim for each address.
    mapping(address => uint256) public lastClaimTime;

    // ── Events ───────────────────────────────────────────────────────────
    event Claimed(address indexed recipient, uint256 amount);
    event Donated(address indexed donor,    uint256 amount);
    event Withdrawn(address indexed to,     uint256 amount);

    // ── Constructor ──────────────────────────────────────────────────────
    /// @dev Deployer seeds the pool by sending tPOTv3 with the deployment tx.
    constructor() payable {
        owner = msg.sender;
    }

    // ── Receive / Donate ─────────────────────────────────────────────────

    /// @dev Accept plain tPOTv3 transfers so the owner can top up via a
    ///      simple send without calling donate().
    receive() external payable {
        emit Donated(msg.sender, msg.value);
    }

    /**
     * @notice Replenish the faucet pool.
     *         Send tPOTv3 along with this call (msg.value > 0).
     */
    function donate() external payable {
        require(msg.value > 0, "tPotFaucet: zero donation");
        emit Donated(msg.sender, msg.value);
    }

    // ── Claim ────────────────────────────────────────────────────────────

    /**
     * @notice Dispense exactly 1 tPOTv3 to `recipient`.
     * @dev    The caller pays the gas.  The recipient can be a different
     *         address — useful for bootstrapping a brand-new wallet that
     *         has no gas at all.
     * @param  recipient  Address that will receive 1 tPOTv3.
     */
    function claim(address payable recipient) external {
        require(recipient != address(0), "tPotFaucet: zero address");
        require(
            block.timestamp >= lastClaimTime[recipient] + COOLDOWN,
            "tPotFaucet: cooldown active - wait 72 hours"
        );
        require(
            address(this).balance >= CLAIM_AMOUNT,
            "tPotFaucet: pool empty - please donate to replenish"
        );

        // Effects before interaction (CEI pattern)
        lastClaimTime[recipient] = block.timestamp;

        // Interaction — push native tPOTv3 to recipient
        (bool ok, ) = recipient.call{value: CLAIM_AMOUNT}("");
        require(ok, "tPotFaucet: native transfer failed");

        emit Claimed(recipient, CLAIM_AMOUNT);
    }

    // ── View helpers ─────────────────────────────────────────────────────

    /**
     * @notice Seconds remaining until `addr` can claim again.
     *         Returns 0 if the address is currently eligible.
     */
    function cooldownRemaining(address addr) external view returns (uint256) {
        uint256 unlockAt = lastClaimTime[addr] + COOLDOWN;
        if (block.timestamp >= unlockAt) return 0;
        return unlockAt - block.timestamp;
    }

    /// @notice Current tPOTv3 held by the faucet (in wei).
    function poolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ── Owner ────────────────────────────────────────────────────────────

    /**
     * @notice Emergency: withdraw all tPOTv3 from the contract.
     *         Only the deployer can call this.
     */
    function emergencyWithdraw(address payable to) external {
        require(msg.sender == owner, "tPotFaucet: not owner");
        uint256 bal = address(this).balance;
        require(bal > 0, "tPotFaucet: nothing to withdraw");
        (bool ok, ) = to.call{value: bal}("");
        require(ok, "tPotFaucet: withdraw failed");
        emit Withdrawn(to, bal);
    }
}
