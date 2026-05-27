"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMatch } from "@/lib/use-match";
import { getWallet, resetWallets } from "@/lib/match";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LobbyPage() {
  const router = useRouter();
  const { state, role, hydrated, claimRole, send } = useMatch();
  const [wallets, setWallets] = useState<{ p1: number; p2: number } | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    setWallets({ p1: getWallet("p1"), p2: getWallet("p2") });
  }, [hydrated, state.matchId, state.phase]);

  const joinAs = (r: "p1" | "p2" | "audience") => {
    claimRole(r);
    if (r === "audience") {
      router.push(state.phase === "battle" ? "/battle" : "/spectate");
    } else {
      router.push("/select");
    }
  };

  const startFresh = () => {
    send({ type: "RESET" });
    claimRole("p1");
    router.push("/select");
  };

  const onResetWallets = () => {
    resetWallets();
    setWallets({ p1: 100, p2: 100 });
  };

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl space-y-10">
        <header className="text-center space-y-4">
          <p className="font-arcade text-xs text-neon-yellow animate-flicker tracking-widest">
            INSERT COIN
          </p>
          <h1 className="font-arcade text-3xl sm:text-5xl glow-red leading-tight">
            CRYPTO<br />BATTLE ARENA
          </h1>
          <p className="font-terminal text-xl text-muted-foreground max-w-md mx-auto">
            Pick your coin. State your point. Win the crowd.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Badge variant="outline" className="font-arcade text-[10px]">
              MATCH {state.matchId}
            </Badge>
            {role && (
              <Badge className="font-arcade text-[10px]">
                YOU: {role.toUpperCase()}
              </Badge>
            )}
            {state.phase !== "lobby" && (
              <Badge variant="secondary" className="font-arcade text-[10px]">
                PHASE: {state.phase.toUpperCase()}
              </Badge>
            )}
          </div>
        </header>

        <Card className="border-neon-red/40 ring-glow-red">
          <CardHeader>
            <CardTitle className="font-arcade text-sm">QUICK START</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-terminal text-lg text-muted-foreground">
              Open this page in <span className="text-foreground font-bold">three tabs</span>.
              Pick Player 1, Player 2, and Audience. Battle begins when both fighters are ready.
            </p>
            <Button onClick={startFresh} className="w-full font-arcade text-sm h-12">
              ▶ NEW MATCH
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-neon-red/40">
            <CardContent className="p-6 text-center space-y-3">
              <p className="font-arcade text-xs glow-red">PLAYER 1</p>
              <p className="font-terminal text-base text-muted-foreground">
                Red corner. Pick a coin to represent.
              </p>
              <Badge variant="outline" className="font-arcade text-[10px] border-neon-red/60">
                💰 {wallets?.p1 ?? "—"} PXL
              </Badge>
              <Button
                onClick={() => joinAs("p1")}
                variant="outline"
                className="w-full font-arcade text-xs border-neon-red/60 hover:bg-neon-red/10"
              >
                JOIN AS P1
              </Button>
            </CardContent>
          </Card>

          <Card className="border-neon-blue/40">
            <CardContent className="p-6 text-center space-y-3">
              <p className="font-arcade text-xs glow-blue">PLAYER 2</p>
              <p className="font-terminal text-base text-muted-foreground">
                Blue corner. Pick a coin to represent.
              </p>
              <Badge variant="outline" className="font-arcade text-[10px] border-neon-blue/60">
                💰 {wallets?.p2 ?? "—"} PXL
              </Badge>
              <Button
                onClick={() => joinAs("p2")}
                variant="outline"
                className="w-full font-arcade text-xs border-neon-blue/60 hover:bg-neon-blue/10"
              >
                JOIN AS P2
              </Button>
            </CardContent>
          </Card>

          <Card className="border-neon-green/40">
            <CardContent className="p-6 text-center space-y-3">
              <p className="font-arcade text-xs glow-green">AUDIENCE</p>
              <p className="font-terminal text-base text-muted-foreground">
                Watch the fight. Vote each round.
              </p>
              <Button
                onClick={() => joinAs("audience")}
                variant="outline"
                className="w-full font-arcade text-xs border-neon-green/60 hover:bg-neon-green/10"
              >
                JOIN AS CROWD
              </Button>
            </CardContent>
          </Card>
        </div>

        <footer className="text-center space-y-3 font-terminal text-base text-muted-foreground/70">
          <Link href="/spectate" className="hover:text-foreground underline-offset-4 hover:underline block">
            Just want to spectate? →
          </Link>
          <button
            onClick={onResetWallets}
            className="font-arcade text-[10px] text-muted-foreground/60 hover:text-foreground/80"
          >
            ⟲ RESET WALLETS TO 100 PXL
          </button>
        </footer>
      </div>
    </main>
  );
}
