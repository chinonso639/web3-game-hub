import { createConfig, http } from "wagmi";
import { polygon, polygonMumbai } from "wagmi/chains";
import { metaMask, injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [polygon, polygonMumbai],
  connectors: [metaMask(), injected()],
  transports: {
    [polygon.id]: http(),
    [polygonMumbai.id]: http(),
  },
});
