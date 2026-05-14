import { sepolia } from "wagmi/chains";

// Deployed on Sepolia (chain 11155111)
export const CONTRACTS = {
  mockUsdc: "0x9ce97859A09EE07B24578D1FaFDFF1f711f86B2b",
  treasury: "0xA69b8EAac0319ad4E54cC363d74f017b1A91C80e",
  bondVault: "0x69b9876BA5e7Ee01133AeB803e19537a0Cd2C62A",
  sealedTrade: "0xFe6fD012A6632Cb9B062373A1a2333A0D047bF44",
} as const;

export const ACTIVE_CHAIN = sepolia;

// Block number when contracts were deployed — used as fromBlock for event queries
export const DEPLOY_BLOCK = 10847566n;
