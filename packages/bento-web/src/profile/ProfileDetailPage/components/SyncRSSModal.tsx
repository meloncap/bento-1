import axios from 'axios';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';

import { LinkBlockItem } from '@/profile/blocks/LinkBlockItem';
import { FieldInput } from '@/profile/components/FieldInput';

type Props = {
  isVisible?: boolean;
  onDismiss?: () => void;
};

type FeedItem = {
  link?: string;
  guid?: string;
  title?: string;
  pubDate?: string;
  creator?: string;
  summary?: string;
  content?: string;
  contentSnippet?: string;
  isoDate?: string;
  categories?: string[];
  enclosure?: {
    url: string;
    length?: number;
    type?: string;
  };
  ogImageURL: string | null;
};

const RSS_FEED_LIMIT = 15;

export const SyncRSSModal: React.FC<Props> = ({
  isVisible = false,
  onDismiss,
}) => {
  const [rssURL, setRssURL] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  const onClickSubscribe = useCallback(async () => {
    setLoading(true);
    const { data } = await axios.get(
      `https://feed.inevitable.team/api/rss?rssURL=${rssURL}&limit=${RSS_FEED_LIMIT}`,
    );
    setLoading(false);
    setFeedItems(data);
  }, [rssURL]);

  return (
    <OverlayWrapper
      visible={isVisible}
      onDismiss={onDismiss}
      transition={{ ease: 'linear' }}
    >
      <Container>
        {loading ? (
          <Title>Loading...</Title>
        ) : !feedItems.length ? (
          <>
            <Title>Subscribe RSS</Title>
            <FieldInput
              field="URL"
              value={rssURL}
              onChange={(e) => setRssURL(e.target.value)}
            />
            <Button onClick={onClickSubscribe}>Subscribe</Button>
          </>
        ) : (
          <ProfileLinkList>
            {feedItems.map((item, index) => {
              const description =
                item.summary || item.contentSnippet || item.content;
              return (
                <LinkBlockItem
                  key={index}
                  title={item.title || ''}
                  description={description}
                  url={item.link || ''}
                  images={[item.ogImageURL || '']}
                  type="link"
                />
              );
            })}
          </ProfileLinkList>
        )}
      </Container>
    </OverlayWrapper>
  );
};

const OverlayWrapper = styled(Modal)`
  .modal-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Container = styled.div`
  padding: 32px 16px;
  width: 80%;
  max-width: ${500 * 0.8}px;

  max-height: calc(100vh - 64px - 84px);
  overflow: scroll;

  border-radius: 8px;
  background-color: #262b34;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
  user-select: none;
`;

const Title = styled.span`
  margin: 0;
  color: white;
  font-weight: bold;
  font-size: 18.5px;
  cursor: text;
`;

const ProfileLinkList = styled.ul`
  list-style-type: none;
`;
