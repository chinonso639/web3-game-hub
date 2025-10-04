import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // Check if username exists
    const { walletAddress } = req.body;

    try {
      const player = await prisma.player.findUnique({
        where: { walletAddress },
        select: { nickname: true },
      });

      res.status(200).json({ username: player?.nickname || null });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "Failed to check username" });
    }
  } else if (req.method === "PUT") {
    // Save username
    const { walletAddress, username } = req.body;

    try {
      await prisma.player.upsert({
        where: { walletAddress },
        update: { nickname: username },
        create: { walletAddress, nickname: username },
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error saving username:", error);
      res.status(500).json({ error: "Failed to save username" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
