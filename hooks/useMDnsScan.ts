import { useEffect, useState } from "react";
import Zeroconf from "react-native-zeroconf";
import { DiscoveredSite } from "../services/sitePairing";

const SERVICE_TYPE = "zhitong-setup";
const PROTOCOL = "tcp";

export function useMDnsScan(active: boolean) {
  const [sites, setSites] = useState<DiscoveredSite[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!active) return;
    const zc = new Zeroconf();
    setSites([]);
    setScanning(true);

    zc.on("found", (_name: string) => {
      // Just discovered — wait for resolved to get IP/port
    });
    zc.on("resolved", (svc: any) => {
      // svc: { name, host, addresses, port, txt }
      const ip = (svc.addresses || []).find((a: string) => a.includes("."));
      const device_id = (svc.txt && svc.txt.device_id) || svc.name;
      if (ip && svc.port) {
        setSites((prev) => {
          if (prev.some((s) => s.ip === ip)) return prev;
          return [...prev, { ip, port: svc.port, device_id }];
        });
      }
    });

    zc.scan(SERVICE_TYPE, PROTOCOL);

    const stopTimer = setTimeout(() => {
      zc.stop();
      setScanning(false);
    }, 6000); // scan 6 seconds

    return () => {
      clearTimeout(stopTimer);
      zc.removeDeviceListeners();
      zc.stop();
      setScanning(false);
    };
  }, [active]);

  return { sites, scanning };
}
