import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address, chainId, contractAddress } = req.body;

  if (!address || !chainId || !contractAddress) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Use different RPC based on chain
    const rpcUrl =
      chainId === 137
        ? "https://polygon-rpc.com/"
        : "https://rpc-mumbai.maticvigil.com/";

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

    const [balance, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals(),
    ]);

    // Convert balance to human readable format
    const formattedBalance = ethers.formatUnits(balance, decimals);

    res.status(200).json({
      balance: parseFloat(formattedBalance).toFixed(2),
      raw: balance.toString(),
      decimals: decimals.toString(),
    });
  } catch (error) {
    console.error("Error fetching USDT balance:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
}
