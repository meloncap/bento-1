import { Wallet } from '@bento/common';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';

import { walletsAtom } from '@/recoil/wallets';
import { Supabase } from '@/utils/Supabase';

import { useSession } from './useSession';

const RevalidateWalletsContext = React.createContext<
  () => Promise<Wallet[] | undefined>
>(async () => undefined);

export const RevalidateWalletsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { session } = useSession();
  const setWallets = useSetRecoilState(walletsAtom);

  const revalidateWallets = useCallback(async () => {
    if (!session || !session.user) {
      return;
    }
    const walletQuery = await Supabase.from('wallets')
      .select('*')
      .eq('user_id', session.user.id);
    const wallets: Wallet[] = walletQuery.data ?? [];

    if (wallets.length > 0) {
      setWallets(wallets);
    }

    return wallets;
  }, [JSON.stringify(session), setWallets]);

  const [wallets] = useRecoilState(walletsAtom);
  const [isWalletEmpty, setWalletEmpty] = useState<boolean>(false);

  useEffect(() => {
    if (wallets.length === 0 && !isWalletEmpty) {
      revalidateWallets().then((wallets) => {
        if (!wallets || wallets.length === 0) {
          setWalletEmpty(true);
        }
      });
    }
  }, [wallets, revalidateWallets]);

  useEffect(() => {
    Supabase.auth.onAuthStateChange((event, _session) => {
      if (event == 'SIGNED_IN') {
        revalidateWallets().then((wallets) => {
          if (!wallets || wallets.length === 0) {
            setWalletEmpty(true);
          }
        });
      }
    });
  }, [revalidateWallets]);

  return (
    <RevalidateWalletsContext.Provider value={revalidateWallets}>
      {children}
    </RevalidateWalletsContext.Provider>
  );
};

export const useRevalidateWallets = () => useContext(RevalidateWalletsContext);
