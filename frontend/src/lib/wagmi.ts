import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Supported",
      wallets: [metaMaskWallet],
    },
  ],
  {
    appName: "Sealed Trade Protocol",
    projectId: "demo",
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});
