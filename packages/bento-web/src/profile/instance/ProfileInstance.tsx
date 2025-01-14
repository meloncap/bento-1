import { OpenSeaAsset } from '@bento/client';
import { Wallet } from '@bento/common';
import axios, { AxiosError } from 'axios';
import dedent from 'dedent';
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import groupBy from 'lodash.groupby';
import { useRouter } from 'next/router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRecoilValue } from 'recoil';
import styled, { css } from 'styled-components';

import { Modal } from '@/components/Modal';
import { walletsAtom } from '@/recoil/wallets';
import { FeatureFlags } from '@/utils/FeatureFlag';
import { Supabase } from '@/utils/Supabase';
import { Analytics } from '@/utils/analytics';
import { copyToClipboard } from '@/utils/clipboard';
import { toast } from '@/utils/toast';

import { DashboardTokenBalance } from '@/dashboard/types/TokenBalance';
import { WalletBalance } from '@/dashboard/types/WalletBalance';
import { useNFTBalances } from '@/dashboard/utils/useNFTBalances';
import { useWalletBalances } from '@/dashboard/utils/useWalletBalances';
import { Palette, usePalette } from '@/profile/hooks/usePalette';
import { UserProfile } from '@/profile/types/UserProfile';

import {
  ProfileEditor,
  UserInformationDraft,
} from '../components/ProfileEditor';
import { FixedFooter } from './components/FixedFooter';
import { ProfileViewer } from './components/ProfileViewer';
import { StickyTab } from './components/StickyTab';
import { TickerCarousel } from './components/TickerCarousel';
import { AssetSection } from './sections/AssetSection';
import { NFTSection } from './sections/NFTSection';
import { ProfileLinkSection } from './sections/ProfileLinkSection';
import { ProfileWalletList } from './sections/ProfileWalletList';

const MINIMAL_NET_WORTH = 0.0001;

type ErrorResponse =
  | {
      code: 'USERNAME_UNUSABLE' | 'VALUE_REQUIRED' | string;
      message: string;
    }
  | undefined;

const EMPTY_DRAFT: UserInformationDraft = {
  username: '',
  displayName: '',
  bio: '',
};

const data = {
  color: '#ff3856',
  background: dedent`
    linear-gradient(to right bottom, #E35252 0%, #DB6E57 29.47%, #C22E3A 65.1%)
  `,
};

enum ProfileTab {
  Links = 'Links',
  Questions = 'Questions',
  Wallets = 'Wallets',
  Assets = 'Assets',
  NFTs = 'NFTs',
}

const PROFILE_TABS = [
  ...(FeatureFlags.isProfileLinksEnabled ? [ProfileTab.Links] : []),
  ...(FeatureFlags.isProfileQuestionsEnabled ? [ProfileTab.Questions] : []),
  ProfileTab.Wallets,
  ProfileTab.Assets,
  ProfileTab.NFTs,
];

type ProfileInstanceProps = {
  profile: UserProfile | null;
  revaildateProfile?: () => Promise<void>;
  isMyProfile?: boolean;
};

const walletBalanceReducer =
  (key: string, callback: (acc: number, balance: WalletBalance) => number) =>
  (acc: number, balance: WalletBalance) =>
    (balance.symbol ?? balance.name) === key ? callback(acc, balance) : acc;

const fetchWallets = async (userId: string): Promise<Wallet[]> => {
  const walletQuery = await Supabase.from('wallets')
    .select('*')
    .eq('user_id', userId);
  return walletQuery.data ?? [];
};

export const ProfileInstance: React.FC<ProfileInstanceProps> = ({
  profile,
  revaildateProfile,
  isMyProfile = false,
}) => {
  const router = useRouter();
  const [isProfileImageModalVisible, setProfileImageModalVisible] =
    useState<boolean>(false);

  const [selectedTab, setSelectedTab] = useState<ProfileTab>(PROFILE_TABS[0]);
  const tabEventProps = useMemo(
    () =>
      !profile
        ? null
        : {
            tab: selectedTab.toLowerCase(),
            user_id: profile.user_id,
            username: profile.username,
            is_my_profile: isMyProfile,
          },
    [selectedTab, profile, isMyProfile],
  );

  const hasLoggedPageViewEvent = useRef<boolean>(false);
  useEffect(() => {
    if (!profile || hasLoggedPageViewEvent.current) {
      return;
    }
    hasLoggedPageViewEvent.current = true;
    Analytics.logEvent('view_profile', {
      user_id: profile.user_id,
      username: profile.username,
      is_my_profile: isMyProfile,
    });
  }, [profile, isMyProfile]);

  // TODO: check if this render twice in production too
  useEffect(() => {
    if (!tabEventProps) {
      return;
    }
    Analytics.logEvent('view_profile_tab', tabEventProps);
  }, [JSON.stringify(tabEventProps)]);

  const myWalletsInState = useRecoilValue(walletsAtom);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  useEffect(() => {
    if (!!profile?.user_id) {
      fetchWallets(profile.user_id)
        .then(setWallets)
        .catch(() => {
          setWallets([]);
        });
    }
  }, [myWalletsInState, profile?.user_id]);

  const { balances: walletBalances } = useWalletBalances({ wallets });
  const { balances: nftBalances } = useNFTBalances({ wallets });

  const tokenBalances = useMemo<DashboardTokenBalance[]>(() => {
    // NOTE: `balance.symbol + balance.name` 로 키를 만들어 groupBy 하고, 그 결과만 남긴다.
    // TODO: 추후 `tokenAddress` 로만 그룹핑 해야 할 것 같다(같은 심볼과 이름을 사용하는 토큰이 여러개 있을 수 있기 때문).
    const balancesByPlatform = Object.entries(
      groupBy<WalletBalance>(
        [...walletBalances],
        (balance) => balance.symbol + balance.name,
      ),
    ).map((v) => v[1]);

    const tokens = balancesByPlatform
      .map((balances) => {
        // NOTE: balances 는 모두 같은 토큰의 정보를 담고 있기에, first 에서만 정보를 꺼내온다.
        const [first] = balances;

        const amount = balances.reduce(
          walletBalanceReducer(
            first.symbol ?? first.name,
            (acc, balance) =>
              acc +
              balance.balance +
              ('delegations' in balance ? balance.delegations : 0),
          ),
          0,
        );

        return {
          platform: first.platform,
          symbol: first.symbol,
          name: first.name,
          logo: first.logo,
          type: 'type' in first ? first.type : undefined,
          tokenAddress: 'address' in first ? first.address : undefined,
          balances: balances,
          netWorth: amount * first.price,
          amount,
          price: first.price,
          coinGeckoId: 'coinGeckoId' in first ? first.coinGeckoId : undefined,
        };
      })
      .flat();

    tokens.sort((a, b) => b.netWorth - a.netWorth);
    return tokens.filter((v) => v.netWorth > MINIMAL_NET_WORTH);
  }, [walletBalances]);

  const nftAssets = useMemo<OpenSeaAsset[]>(
    () =>
      nftBalances?.flatMap((item) => ('assets' in item ? item.assets : [])) ??
      [],
    [nftBalances],
  );

  const palette = usePalette(data.color);
  const profileImageURL =
    profile?.images?.[0] ?? '/assets/mockups/profile-default.png';

  const [isEditing, setEditing] = useState<boolean>(false);

  const [draft, setDraft] = useState<UserInformationDraft>({
    username: '',
    displayName: '',
    bio: '',
  });
  const onProfileEdit = useCallback(async () => {
    if (!isEditing) {
      Analytics.logEvent('click_edit_my_profile', {
        title: 'Edit Profile',
      });
      setDraft({
        username: profile?.username ?? '',
        displayName: profile?.display_name ?? '',
        bio: profile?.bio ?? '',
      });
      setTimeout(() => {
        setEditing(true);
      });
      return;
    }

    // FIXME: Duplicated logic
    try {
      const { data } = await axios.post(`/api/profile`, {
        username: draft.username.toLowerCase(),
        display_name: draft.displayName,
        bio: draft.bio,
      });
      console.log(data);

      const [createdProfile] = data.body as UserProfile[];

      setEditing(false);
      setDraft(EMPTY_DRAFT);

      toast({
        type: 'success',
        title: 'Changes Saved',
      });

      if (createdProfile.username !== profile?.username) {
        router.push(`/u/${createdProfile.username}`);
      } else {
        revaildateProfile?.();
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        const errorResponse = e.response?.data as ErrorResponse;
        if (errorResponse?.code === 'USERNAME_UNUSABLE') {
          toast({
            type: 'error',
            title: errorResponse.message,
            description: 'Please choose another username',
          });
          setDraft((prev) => ({ ...prev, username: '' }));
        } else if (errorResponse?.code === 'VALUE_REQUIRED') {
          toast({
            type: 'error',
            title: errorResponse.message,
          });
        } else {
          toast({
            type: 'error',
            title: 'Server Error',
            description: errorResponse?.message || 'Something went wrong',
          });
        }
      }
    }
  }, [profile, isEditing, draft, router]);

  return (
    <React.Fragment>
      <TickerCarousel />

      <ProfileImageContainer $isDefault={!profile?.images?.[0]}>
        <ProfileImage
          src={profileImageURL}
          $isDefault={!profile?.images?.[0]}
        />

        {!!profile && (
          <EarlyBentoBadge
            alt="2022 OG - Early Bento"
            src="/assets/profile/2022-early-bento.png"
          />
        )}

        {isMyProfile && !isEditing && (
          <ProfileEditButton onClick={onProfileEdit}>
            Edit Profile
          </ProfileEditButton>
        )}

        <Information>
          <ProfileViewer profile={profile ?? undefined} />
        </Information>
      </ProfileImageContainer>

      <ProfileEditModal
        visible={isEditing}
        onDismiss={() => setEditing((prev) => !prev)}
      >
        <ProfileEditContainer>
          <ProfileEditor
            draft={draft}
            setDraft={setDraft}
            onSubmit={onProfileEdit}
          />
        </ProfileEditContainer>
      </ProfileEditModal>

      <Modal
        visible={isProfileImageModalVisible}
        onDismiss={() => setProfileImageModalVisible((prev) => !prev)}
      >
        <LargeProfileImage src={profileImageURL} />
      </Modal>
      <StickyTab
        selected={selectedTab}
        items={PROFILE_TABS}
        onChange={(tab) => setSelectedTab(tab)}
        primaryColor={palette.primary}
        shadowColor={palette.primaryShadow}
      />

      <AnimatePresence initial={false}>
        <TabContent palette={palette}>
          {FeatureFlags.isProfileLinksEnabled && (
            <AnimatedTab selected={selectedTab === ProfileTab.Links}>
              <ProfileLinkSection
                isMyProfile={isMyProfile}
                blocks={profile?.links ?? null}
              />
            </AnimatedTab>
          )}

          {/* <AnimatedTab selected={selectedTab === ProfileTab.Questions}>
            <QuestionSection />
          </AnimatedTab> */}

          <AnimatedTab selected={selectedTab === ProfileTab.Wallets}>
            <ProfileWalletList wallets={wallets} />
          </AnimatedTab>
          <AnimatedTab selected={selectedTab === ProfileTab.Assets}>
            <AssetSection tokenBalances={tokenBalances} />
          </AnimatedTab>
          <AnimatedTab selected={selectedTab === ProfileTab.NFTs}>
            <NFTSection
              nftAssets={nftAssets}
              selected={selectedTab === ProfileTab.NFTs}
              isMyProfile={isMyProfile}
              profile={profile}
              onClickSetAsProfile={async (assetImage) => {
                try {
                  await axios.post(`/api/profile`, {
                    username: profile?.username.toLowerCase(),
                    display_name: profile?.display_name,
                    images: [assetImage],
                  });
                  revaildateProfile?.();

                  setTimeout(() => {
                    toast({
                      type: 'success',
                      title: 'Changes Saved',
                    });

                    document.body.scrollIntoView({
                      behavior: 'smooth',
                    });
                  });
                } catch (e) {
                  if (e instanceof AxiosError) {
                    const errorResponse = e.response?.data as ErrorResponse;
                    if (errorResponse?.code === 'USERNAME_UNUSABLE') {
                      toast({
                        type: 'error',
                        title: errorResponse.message,
                        description: 'Please choose another username',
                      });
                      setDraft((prev) => ({ ...prev, username: '' }));
                    } else if (errorResponse?.code === 'VALUE_REQUIRED') {
                      toast({
                        type: 'error',
                        title: errorResponse.message,
                      });
                    } else {
                      toast({
                        type: 'error',
                        title: 'Server Error',
                        description:
                          errorResponse?.message || 'Something went wrong',
                      });
                    }
                  }
                }
              }}
            />
          </AnimatedTab>
        </TabContent>
      </AnimatePresence>

      {isMyProfile && (
        <FixedFooter
          onClickShare={() => {
            Analytics.logEvent('click_share_my_profile', {
              title: 'Share',
            });

            Analytics.logEvent('click_copy_profile_link', {
              user_id: profile?.user_id ?? '',
              username: profile?.username ?? '',
              is_my_profile: true,
            });
            copyToClipboard(`${window.location.origin}/u/${profile?.username}`);
            toast({
              title: 'Copied link to clipboard!',
              description: `Profile @${profile?.username}`,
            });
          }}
        />
      )}
    </React.Fragment>
  );
};

type IsDefaultImageProps = {
  $isDefault: boolean;
};
const ProfileImageContainer = styled.div<IsDefaultImageProps>`
  width: 100%;
  padding-bottom: 100%;
  background-color: black;
  position: relative;
  aspect-ratio: 1;
  z-index: 0;
  overflow: hidden;

  &:after {
    content: '';
    width: 100%;
    height: 75%;

    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;

    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 25%, #000000 80%);
    z-index: 1;

    ${({ $isDefault }) =>
      $isDefault &&
      css`
        background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%);
      `};
  }
`;
const ProfileImage = styled.img<IsDefaultImageProps>`
  margin-top: -5%;
  width: 100%;
  height: 90%;
  object-fit: cover;
  user-select: none;

  position: absolute;
  background-color: black;

  ${({ $isDefault }) =>
    $isDefault &&
    css`
      margin-top: 0;
      width: 100%;
      height: 100%;
    `};
`;
const EarlyBentoBadge = styled.img`
  position: absolute;
  top: 20px;
  right: 20px;

  width: 120px;
  height: 120px;
  border-radius: 50%;

  filter: saturate(1.25) drop-shadow(0px 8px 24px rgba(0, 0, 0, 0.6));
  user-select: none;
  transition: all 0.2s ease-in-out;

  @media screen and (max-width: 32rem) {
    width: 100px;
    height: 100px;
  }

  @media screen and (max-width: 320px) {
    top: 16px;
    right: 16px;
    width: 84px;
    height: 84px;
  }
`;

const Information = styled.div`
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 18px;

  display: flex;
  flex-direction: column;
  z-index: 2;
`;

const ProfileEditButton = styled.button`
  padding: 4px 12px;

  border-radius: 24px;
  border-width: 2px;

  position: absolute;
  top: 20px;
  left: 16px;

  color: rgb(241 245 249 / 0.75);
  border-color: rgb(241 245 249 / 0.75);
  transition: all 0.2s ease-in-out;

  :hover {
    opacity: 0.5;
  }
`;

const LargeProfileImage = styled.img`
  max-width: 500px;
  width: 85vw;
  aspect-ratio: 1;
  border-radius: 50%;
`;

type TabContentProps = {
  palette: Palette;
};
const TabContent = styled.div<TabContentProps>`
  padding: 16px 20px 0;

  button.submit {
    color: rgba(23, 27, 32, 0.75);

    &:active {
      opacity: 0.65;
    }

    ${({ palette }) => css`
      background-color: ${palette.primary};
      box-shadow: 0 8px 16px ${palette.primaryShadow};
      text-shadow: 2px 2px 4px ${palette.darkShadow};

      &:hover {
        background-color: ${palette.dark};
        box-shadow: 0 4px 16px ${palette.darkShadow};
        transform: scale(1.05);
      }
    `};
  }
`;

type AnimatedTabProps = {
  selected: boolean;
};
const AnimatedTab = (props: AnimatedTabProps & HTMLMotionProps<'div'>) => (
  <motion.div
    animate={
      !props.selected
        ? { opacity: 0, transform: 'scale(0.9)' }
        : { opacity: 1, transform: 'scale(1)' }
    }
    style={{
      originY: 0,
      paddingBottom: 220,
      display: !props.selected ? 'none' : 'block',
    }}
    transition={{ duration: 0.35 }}
    {...props}
  />
);

const ProfileEditModal = styled(Modal)`
  .modal-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;
const ProfileEditContainer = styled.div`
  padding: 32px 16px;
  width: 80vw;
  max-width: ${500 * 0.8}px;

  border-radius: 8px;
  background-color: rgba(38, 43, 52, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
  user-select: none;
`;
