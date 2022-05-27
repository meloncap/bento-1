# 🍱 Bento, the Web3 SuperApp

## Background

- 체인별로 데이터랑 서비스가 분산화되어 있음.
- 대시보드 같은 제품이 하나 나와도 특정 체인에서 나오거나, 체인이나 플랫폼을 미는 VC에서 투자받으니까, 서비스가 특정 체인에만 귀속될 수밖에 없음

## 🚣 Milestones

### 1. Web3 Dashboard(1.0) ✅

1.  다양한 체인, 플랫폼별로 파편화된 블록체인 지갑 한번에 모으기(Grouping blockchain wallets)
2.  현재 자산 가치 표시, 현재 투자하고 있는 디파이 표시 ⇒ 포트폴리오 제공
3.  지원하는 플랫폼별로 마케팅

### 2. Social Profiles

1. Web2 - Profile links + Social (Gen Z)

- 프로필 링크 제공
- 익명질문(에스크)

2. Asset-based communities

- 지갑, NFT 목록 등 공개, “업적” 표시
- “특정 자산 보유”, “몇년부터 활동한 OG” 등

3. 업적 공개된 상태로 토스 “오픈채팅”

### 3. Labeling Transactions

1.  Transaction History + Social ⇒ Like Venmo, Toss
2.  Categorization ⇒ SaaS

### 4. SuperApp

- Web3 DApp Explorer
- Meta + Universe

## 🚀 Preparing Local Dev Environment

```bash
git clone https://github.com/inevt/dashboard
cd dashboard
yarn install
```

- [Yarn Berry의 Plug’n’Play를 통한 Zero-Install](https://toss.tech/article/node-modules-and-yarn-berry)을 사용하고 있습니다. 이 때문에, 처음에 클론하는 저장소의 크기가 생각보다 큽니다.

```bash
yarn workspace @bento/core build
```

- 프로젝트 전체는 Yarn Workspaces를 사용한 모노레포로 관리되고 있습니다.
- `@bento/core` 모듈을 먼저 빌드하셔야 합니다. 이후에도 `@bento/core`에 수정사항이 있을 경우, `@bento/web`의 개발 서버를 끌 필요 없이 바로 빌드만 해주면 알아서 리로딩 됩니다(단, 의존성이 변경되었을 경우 재시작 필요).

```bash
yarn workspace @bento/web dev
```

- `@bento/web`의 개발 서버를 켭니다. 기본값으로 `3000` 포트가 설정되어 있습니다.

## 👽 Prior Knowledge

### 체인(Chains)

#### EVM

- 이더리움, 폴리곤, 아발란체, 클레이튼 등 EVM(이더리움 가상 머신) 기반 블록체인
- 토큰
  - 네이티브 토큰(Currency)이 네트워크별로 한 개
    - 이더리움(ETH), 폴리곤의 매틱(MATIC), 아발란체(AVAX), 클레이튼(KLAY)
  - 다른 토큰들은 `ERC20` 표준에 맞게 구현/배포된 컨트랙트의 상태로 정의됨

#### Tendermint

- [텐더민트 기반](https://academy.binance.com/ko/articles/tendermint-explained) 블록체인. Cosmos SDK 쓰는 애들
- 코스모스 허브(Cosmos Hub), 오스모시스(Osmosis), ~~테라(Terra, 뒤짐)~~ 등

- 토큰

  - 네이티브 토큰이 체인마다 여러 개 있을 수 있음
    - 코스모스 허브의 아톰(ATOM), 오스모시스의 오스모(OSMO) 그리고 아이온(ION)
    - ~~뒤진~~ 테라 같은 경우에는 LUNA, UST, KST, ... 등등 스테이블코인들이 모두 네이티브로 구현되어 있음
  - 다른 토큰들은 `CW20` 표준에 맞게 구현/배포된 컨트랙트의 상태로 정의됨
  - 네이티브 토큰과 다른 토큰은 `IBC` 를 통해 다른 Cosmos SDK 기반 체인으로 이동이 가능하다.
    - 즉 코스모스 허브의 아톰(ATOM)이 오스모시스 체인으로 이동할 수 있다.

- [Bech32](https://docs.cosmos.network/master/spec/addresses/bech32.html)
  - 하나의 주소가 다른 Cosmos SDK 기반 체인별로 호환됨
    - `cosmos15zysaya5j34vy2cqd7y9q8m3drjpy0d2hhgxh0`
    - `osmo15zysaya5j34vy2cqd7y9q8m3drjpy0d2lvmkpa`

#### Others

솔라나 등

## 🔨 Contributing Guide (Korean)

- **일단 당분간은**

  - **완벽한 코드가 아니더라도 대충 커밋해서 바로 `main` 브랜치에 올리자**
  - 그 다음 천천히 고쳐나가자
  - 나중에 고치고 싶은 게 있거나 아쉬운 게 있으면 `TODO`, `FIXME` 등 주석으로 표시하자

- 나중에 따를 것:
  - 가급적 모든 코드 변경은 PR을 통해 이루어져야 합니다.
  - PR의 제목은 **유저의 입장에서 작성된 스토리**여야 합니다.
    - `사용자는 마이페이지를 볼 수 있습니다.`
    - `사용자는 기존 아이템을 합성해 새로운 아이템을 민팅할 수 있습니다.`
  - **리뷰하기 좋은 커밋**을 만듭니다([Rebase](https://enghqii.tistory.com/54)를 적극 활용할 수 있습니다).
    - 커밋 메시지는 그 주제를 명확히 표시하는 문장이여야 합니다.
      - 추후 오픈소스로 전환할 때를 대비하여 영어를 사용하지만, 이 때문에 결정에 많은 시간이 든다면 한글도 좋습니다.
    - 다른 커밋 컨벤션을 따라도 됩니다.
  - 작업은 **최대한 작은 단위**로 쪼갭니다.
  - 하나의 커밋은 그 작은 단위의 주제를 성실히 표현하는 것이여야 합니다.
    - 이 조건을 만족한다면, 커밋이 완벽할 필요는 없습니다.
      - 예를 들어서, 주제를 잘 표현하기 위해서 구현되지 않은 부분을 `TODO` 또는 `FIXME` 주석으로 표시한 다음 커밋하거나, 린터 규칙을 무시할 수 있습니다.
      - 다만 이러한 **작은 기술 부채**는 PR의 끝에서 이를 다루는 커밋을 추가하거나, 생긴 시점에 주석이나 Task 카드를 만들어 반드시 표시해 두어야 합니다.

## 📒 References

대시보드 하는 애들(심심할 때 위에서 세 개만 보면 될 듯)

- [Apeboard](https://apeboard.finance/)
- [Zapper.fi](https://zapper.fi/)
- [Keplr](https://www.keplr.app/)
- [DeBank](https://debank.com/)
- [Zerion](https://zerion.io/)
