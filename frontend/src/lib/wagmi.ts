import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { WALLETCONNECT_PROJECT_ID } from "./config";

export const wagmiConfig = getDefaultConfig({
  appName: "Sealed Trade Protocol",
  projectId: WALLETCONNECT_PROJECT_ID || "demo",
  chains: [sepolia],
  ssr: true,
});
