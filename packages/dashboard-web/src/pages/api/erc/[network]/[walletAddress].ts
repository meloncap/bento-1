import type { NextApiRequest, NextApiResponse } from 'next';
import { ERCBasedNetworks } from '@dashboard/core/lib/config';
import { safePromiseAll } from '@dashboard/core/lib/utils';
import { Chain, EthereumChain, KlaytnChain } from '@dashboard/core/lib/chains';

interface APIRequest extends NextApiRequest {
  query: {
    network?: ERCBasedNetworks;
    walletAddress?: string;
  };
}

const chains: Record<ERCBasedNetworks, Chain> = {
  ethereum: new EthereumChain(),
  klaytn: new KlaytnChain(),
};

const parseWallets = (mixedQuery: string) => {
  const query = mixedQuery.toLowerCase();
  if (query.indexOf(',') === -1) {
    return [query];
  }
  return query.split(',');
};

export default async (req: APIRequest, res: NextApiResponse) => {
  const wallets = parseWallets(req.query.walletAddress ?? '');
  const network = (req.query.network ?? '').toLowerCase() as ERCBasedNetworks;

  const result = await safePromiseAll(
    wallets.map(async (walletAddress) => {
      if (network === 'ethereum') {
        const chain = chains[network];
        const balance = await chain.getBalance(walletAddress);
        const currencyPrice = await chain.getCurrencyPrice();

        return {
          walletAddress,
          symbol: chain.currency.symbol,
          balance,
          currencyPrice,
        };
      } else if (network === 'klaytn') {
        const chain = chains[network];
        const balance = await chain.getBalance(walletAddress);
        const currencyPrice = await chain.getCurrencyPrice();

        return {
          walletAddress,
          symbol: chain.currency.symbol,
          balance,
          currencyPrice,
        };
      }
    }),
  );

  res.status(200).json(result);
};