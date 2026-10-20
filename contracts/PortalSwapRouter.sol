// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";
import "./interfaces/IPortalSwapPair.sol";
import "./interfaces/IPortalSwapFactory.sol";
import "./interfaces/IWPOT.sol";
import "./PortalSwapERC20.sol";
import "./PortalSwapLibrary.sol";

/**
 * @title PortalSwapRouter
 * @dev Router — main entry point for swaps and liquidity operations
 */
contract PortalSwapRouter {
    address public immutable factory;
    address public immutable WPOT;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "PortalSwapRouter: EXPIRED");
        _;
    }

    constructor(address _factory, address _WPOT) {
        factory = _factory;
        WPOT = _WPOT;
    }

    receive() external payable {
        assert(msg.sender == WPOT);
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        if (IPortalSwapFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            IPortalSwapFactory(factory).createPair(tokenA, tokenB);
        }
        (uint256 reserveA, uint256 reserveB) = PortalSwapLibrary.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = PortalSwapLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "PortalSwapRouter: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = PortalSwapLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "PortalSwapRouter: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = PortalSwapLibrary.pairFor(factory, tokenA, tokenB);
        _safeTransferFrom(tokenA, msg.sender, pair, amountA);
        _safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IPortalSwapPair(pair).mint(to);
    }

    function addLiquidityPOT(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountPOTMin,
        address to,
        uint256 deadline
    ) external payable ensure(deadline) returns (uint256 amountToken, uint256 amountPOT, uint256 liquidity) {
        (amountToken, amountPOT) = _addLiquidity(
            token,
            WPOT,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountPOTMin
        );
        address pair = PortalSwapLibrary.pairFor(factory, token, WPOT);
        _safeTransferFrom(token, msg.sender, pair, amountToken);
        IWPOT(WPOT).deposit{value: amountPOT}();
        assert(IWPOT(WPOT).transfer(pair, amountPOT));
        liquidity = IPortalSwapPair(pair).mint(to);
        if (msg.value > amountPOT) {
            payable(msg.sender).transfer(msg.value - amountPOT);
        }
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = PortalSwapLibrary.pairFor(factory, tokenA, tokenB);
        PortalSwapERC20(pair).transferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = IPortalSwapPair(pair).burn(to);
        (address token0, ) = PortalSwapLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, "PortalSwapRouter: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "PortalSwapRouter: INSUFFICIENT_B_AMOUNT");
    }

    function removeLiquidityPOT(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountPOTMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountToken, uint256 amountPOT) {
        (amountToken, amountPOT) = removeLiquidity(
            token,
            WPOT,
            liquidity,
            amountTokenMin,
            amountPOTMin,
            address(this),
            deadline
        );
        _safeTransfer(token, to, amountToken);
        IWPOT(WPOT).withdraw(amountPOT);
        payable(to).transfer(amountPOT);
    }

    // **** SWAP ****
    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0, ) = PortalSwapLibrary.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address to = i < path.length - 2 ? PortalSwapLibrary.pairFor(factory, output, path[i + 2]) : _to;
            IPortalSwapPair(PortalSwapLibrary.pairFor(factory, input, output)).swap(
                amount0Out,
                amount1Out,
                to,
                new bytes(0)
            );
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = PortalSwapLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "PortalSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        _safeTransferFrom(path[0], msg.sender, PortalSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = PortalSwapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "PortalSwapRouter: EXCESSIVE_INPUT_AMOUNT");
        _safeTransferFrom(path[0], msg.sender, PortalSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function swapExactPOTForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable ensure(deadline) returns (uint256[] memory amounts) {
        require(path[0] == WPOT, "PortalSwapRouter: INVALID_PATH");
        amounts = PortalSwapLibrary.getAmountsOut(factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "PortalSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        IWPOT(WPOT).deposit{value: amounts[0]}();
        assert(IWPOT(WPOT).transfer(PortalSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
    }

    function swapTokensForExactPOT(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WPOT, "PortalSwapRouter: INVALID_PATH");
        amounts = PortalSwapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "PortalSwapRouter: EXCESSIVE_INPUT_AMOUNT");
        _safeTransferFrom(path[0], msg.sender, PortalSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWPOT(WPOT).withdraw(amounts[amounts.length - 1]);
        payable(to).transfer(amounts[amounts.length - 1]);
    }

    function swapExactTokensForPOT(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WPOT, "PortalSwapRouter: INVALID_PATH");
        amounts = PortalSwapLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "PortalSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        _safeTransferFrom(path[0], msg.sender, PortalSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWPOT(WPOT).withdraw(amounts[amounts.length - 1]);
        payable(to).transfer(amounts[amounts.length - 1]);
    }

    function swapPOTForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable ensure(deadline) returns (uint256[] memory amounts) {
        require(path[0] == WPOT, "PortalSwapRouter: INVALID_PATH");
        amounts = PortalSwapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, "PortalSwapRouter: EXCESSIVE_INPUT_AMOUNT");
        IWPOT(WPOT).deposit{value: amounts[0]}();
        assert(IWPOT(WPOT).transfer(PortalSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        if (msg.value > amounts[0]) {
            payable(msg.sender).transfer(msg.value - amounts[0]);
        }
    }

    // **** LIBRARY PASSTHROUGHS ****
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        return PortalSwapLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        return PortalSwapLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountIn) {
        return PortalSwapLibrary.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        return PortalSwapLibrary.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint256 amountOut, address[] memory path) public view returns (uint256[] memory amounts) {
        return PortalSwapLibrary.getAmountsIn(factory, amountOut, path);
    }

    // **** HELPERS ****
    function _safeTransfer(address token, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "PortalSwapRouter: TRANSFER_FAILED");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "PortalSwapRouter: TRANSFER_FROM_FAILED");
    }
}
