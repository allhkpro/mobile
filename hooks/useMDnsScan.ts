import { useCallback, useEffect, useState } from "react";
import { DiscoveredSite } from "../services/sitePairing";

// Real mDNS scanning needs a custom dev client / EAS build with the
// react-native-zeroconf native module. In Expo Go the native module is
// stubbed to null, so `new Zeroconf()` succeeds but `.scan()` crashes
// — we detect that at runtime and fall back to a single stub device
// pointing at 127.0.0.1:9100 so the rest of the pair flow can be
// exercised against a setup-server running on the host.
let ZeroconfClass: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ZeroconfClass = require("react-native-zeroconf").default;
} catch {
  ZeroconfClass = null;
}

const STUB_DEVICE: DiscoveredSite = {
  device_id: "device-DEMO (Expo Go 模拟)",
  ip: "127.0.0.1",
  port: 9100,
};

/**
 * Parse a Bonjour service spec like "_zhitong-setup._tcp.local." or just
 * "zhitong-setup" into the (typeName, protocol) pair that
 * react-native-zeroconf's `.scan(type, protocol)` expects.
 */
function parseService(spec: string): { type: string; protocol: string } {
  const cleaned = spec.replace(/\.local\.?$/, "");
  const parts = cleaned.split(".").filter(Boolean).map((p) => p.replace(/^_/, ""));
  if (parts.length >= 2) {
    return { type: parts[0], protocol: parts[1] };
  }
  return { type: parts[0] || cleaned, protocol: "tcp" };
}

export function useMDnsScan(serviceType: string, active: boolean = true) {
  const [sites, setSites] = useState<DiscoveredSite[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanNonce, setScanNonce] = useState(0);

  const rescan = useCallback(() => setScanNonce((n) => n + 1), []);

  useEffect(() => {
    if (!active || !serviceType) return;
    setSites([]);
    setScanning(true);

    const { type, protocol } = parseService(serviceType);

    let zc: any = null;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function fallbackToStub() {
      // Show a single stub device after 1.5s so the UI stays believable
      // (a brief "scanning..." then "found 1").
      stopTimer = setTimeout(() => {
        if (cancelled) return;
        setSites([STUB_DEVICE]);
        setScanning(false);
      }, 1500);
    }

    if (!ZeroconfClass) {
      fallbackToStub();
    } else {
      try {
        zc = new ZeroconfClass();
        zc.on("found", (_name: string) => {
          // Just discovered — wait for resolved to get IP/port
        });
        zc.on("resolved", (svc: any) => {
          const ip = (svc.addresses || []).find((a: string) => a.includes("."));
          const device_id = (svc.txt && svc.txt.device_id) || svc.name;
          if (ip && svc.port) {
            setSites((prev) => {
              if (prev.some((s) => s.ip === ip)) return prev;
              return [...prev, { ip, port: svc.port, device_id }];
            });
          }
        });
        zc.scan(type, protocol);
        stopTimer = setTimeout(() => {
          if (cancelled) return;
          try { zc.stop(); } catch {}
          setScanning(false);
        }, 6000);
      } catch (e) {
        // Native module call failed — fall back to stub.
        zc = null;
        fallbackToStub();
      }
    }

    return () => {
      cancelled = true;
      if (stopTimer) clearTimeout(stopTimer);
      if (zc) {
        try { zc.removeDeviceListeners?.(); } catch {}
        try { zc.stop(); } catch {}
      }
      setScanning(false);
    };
  }, [active, serviceType, scanNonce]);

  return { sites, scanning, rescan };
}
