import { useState, useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { polygon, polygonMumbai } from "wagmi/chains";
import { toast } from "sonner";

const POLYGON_USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const MUMBAI_USDT_ADDRESS = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"; // Mock USDT for testnet
0xc2132d05d31c914a87c6611c10748aeb04b58e8f;
export function usePolygon() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const targetChainId = polygon.id; // Use mainnet by default
  const usdtAddress =
    chainId === polygonMumbai.id ? MUMBAI_USDT_ADDRESS : POLYGON_USDT_ADDRESS;

  useEffect(() => {
    setIsCorrectNetwork(chainId === polygon.id || chainId === polygonMumbai.id);
  }, [chainId]);

  const addPolygonNetwork = async () => {
    try {
      await window.ethereum?.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x89", // 137 in hex
            chainName: "Polygon Mainnet",
            nativeCurrency: {
              name: "MATIC",
              symbol: "MATIC",
              decimals: 18,
            },
            rpcUrls: ["https://polygon-rpc.com/"],
            blockExplorerUrls: ["https://polygonscan.com/"],
          },
        ],
      });
      return true;
    } catch (error) {
      console.error("Failed to add Polygon network:", error);
      return false;
    }
  };

  const switchToPolygon = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected");
      return false;
    }

    setIsLoading(true);
    try {
      // First try to switch to Polygon
      await switchChain({ chainId: targetChainId });
      toast.success("Switched to Polygon network");
      return true;
    } catch (error: any) {
      // If network not added, add it first
      if (error.code === 4902) {
        const added = await addPolygonNetwork();
        if (added) {
          try {
            await switchChain({ chainId: targetChainId });
            toast.success("Added and switched to Polygon network");
            return true;
          } catch (switchError) {
            toast.error("Failed to switch to Polygon after adding");
            return false;
          }
        } else {
          toast.error("Failed to add Polygon network");
          return false;
        }
      } else if (error.code === 4001) {
        toast.error("Network switch rejected by user");
        return false;
      } else {
        toast.error("Failed to switch network");
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getUsdtBalance = async () => {
    if (!address || !isCorrectNetwork) return;

    try {
      const response = await fetch("/api/usdt-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          chainId,
          contractAddress: usdtAddress,
        }),
      });

      const data = await response.json();
      if (data.balance !== undefined) {
        setUsdtBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch USDT balance:", error);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      getUsdtBalance();
    } else {
      setUsdtBalance("0");
    }
  }, [address, isConnected, isCorrectNetwork, chainId]);

  return {
    isCorrectNetwork,
    usdtBalance,
    isLoading,
    switchToPolygon,
    refreshBalance: getUsdtBalance,
    currentChain:
      chainId === polygon.id
        ? "Polygon"
        : chainId === polygonMumbai.id
        ? "Mumbai"
        : "Unknown",
  };
}
