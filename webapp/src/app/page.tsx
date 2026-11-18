"use client";

import { useCallback, useEffect, useState } from "react";
import GatewayFlow from "@/components/gateway-flow";
import { DashboardShell } from "@/components/dashboard/shell";
import { type CavrData } from "@/components/dashboard/types";

type Session = { identifier: string; ts: number };

const SESSION_KEY = "cavr_session";

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<CavrData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  // restore session (deferred so state updates happen outside the effect body)
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw =
          window.localStorage.getItem(SESSION_KEY) ??
          window.sessionStorage.getItem(SESSION_KEY);
        if (raw) setSession(JSON.parse(raw) as Session);
      } catch {
        // ignore malformed sessions
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  // listen for auth events from the gateway iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.type !== "gateway-auth") return;
      const identifier = String(event.data.identifier ?? "").trim();
      const key = String(event.data.key ?? "").trim();
      if (!identifier || !key) return;
      const persistent = Boolean(event.data.persistent);
      const s: Session = { identifier, ts: Date.now() };
      try {
        (persistent ? window.localStorage : window.sessionStorage).setItem(
          SESSION_KEY,
          JSON.stringify(s),
        );
      } catch {
        // storage may be unavailable; keep session in memory
      }
      setSession(s);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cavr/data", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setData({
          checkpoints: json.checkpoints,
          results: json.results,
        });
      } else {
        setDataError(String(json.error ?? "unknown error"));
      }
    } catch (error) {
      setDataError(String(error));
    }
  }, []);

  useEffect(() => {
    if (session && !data && !dataError) {
      const t = window.setTimeout(() => void load(), 0);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [session, data, dataError, load]);

  const disconnect = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setSession(null);
    setData(null);
    setDataError(null);
  }, []);

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <GatewayFlow className="h-full w-full" />
      </div>
    );
  }

  return (
    <DashboardShell
      operator={session.identifier}
      data={data}
      dataError={dataError}
      onDisconnect={disconnect}
    />
  );
}
