import React from 'react';
import styled from 'styled-components';

import { Badge } from '@/components/Badge';
import { systemFontStack } from '@/styles/fonts';

export const HeaderSection = () => {
  return (
    <Container id="header">
      <Badge>INTRODUCING BENTO</Badge>
      <Title>
        The Web3
        <br />
        Lunchbox
        <br />
        Crafted
        <br />
        Just For You.
      </Title>
      <Description>
        Group your wallets
        <br />
        and track DeFi portfolios
        <br />
        in various L1 chains.
      </Description>

      <ButtonLink href="https://app.bento.finance">
        <Button>Launch App</Button>
      </ButtonLink>
    </Container>
  );
};

const Container = styled.header`
  display: flex;
  flex-direction: column;
  background-color: black;
`;

const Title = styled.h1`
  margin: 0;
  margin-top: 24px;

  font-family: ${systemFontStack};
  font-weight: 900;
  font-size: 64px;
  line-height: 103%;
  letter-spacing: 0.01em;
  color: #ffffff;
`;

const Description = styled.p`
  margin: 0;
  margin-top: 32px;

  font-family: ${systemFontStack};
  font-weight: 500;
  font-size: 18px;
  line-height: 120%;
  color: rgba(255, 255, 255, 0.8);
`;

const ButtonLink = styled.a`
  margin-top: 48px;
`;

const Button = styled.button`
  padding: 20px 80px;
  cursor: pointer;

  border-radius: 8px;
  border: 1px solid rgba(255, 165, 165, 0.66);
  background: radial-gradient(98% 205% at 0% 0%, #74021a 0%, #c1124f 100%);
  filter: drop-shadow(0px 10px 32px rgba(151, 42, 53, 0.33));

  font-family: ${systemFontStack};
  font-style: normal;
  font-weight: 700;
  font-size: 21.3946px;

  line-height: 100%;
  text-align: center;
  letter-spacing: -0.05em;

  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0px 4px 12px rgba(101, 0, 12, 0.42);
`;
