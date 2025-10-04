"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "lucide-react";

interface UsernameModalProps {
  isOpen: boolean;
  onSubmit: (username: string) => void;
  isLoading?: boolean;
}

export function UsernameModal({
  isOpen,
  onSubmit,
  isLoading,
}: UsernameModalProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <User className="w-5 h-5 text-blue-400" />
            Choose Your Username
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-gray-400 text-sm mb-3 text-center">
              Enter a username to display in games
            </p>
            <Input
              placeholder="Enter username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
              maxLength={20}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Saving..." : "Save Username"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
