"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

export function useUsername() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      setUsername(null); // Reset username state
      setShowModal(false); // Reset modal state
      checkUsername();
    } else {
      setUsername(null);
      setShowModal(false);
    }
  }, [isConnected, address]);

  const checkUsername = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();

      if (data.username) {
        setUsername(data.username);
        setShowModal(false);
      } else {
        setUsername(null);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setShowModal(true); // Show modal on error to be safe
    } finally {
      setIsLoading(false);
    }
  };

  const saveUsername = async (newUsername: string) => {
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          username: newUsername,
        }),
      });

      if (response.ok) {
        setUsername(newUsername);
        setShowModal(false);
      } else {
        console.error("Failed to save username");
      }
    } catch (error) {
      console.error("Error saving username:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    username,
    showModal,
    isLoading,
    saveUsername,
  };
}
