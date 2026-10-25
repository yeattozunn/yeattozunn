import { BatrakovComposition, BjkComposition, Derby2Composition, DerbyComposition, TeaserComposition, Lille2Composition, MyComposition } from "./Composition";
import { ProfileCompositions } from "./profile";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <DerbyComposition />
      <Lille2Composition />
      <BjkComposition />
      <BatrakovComposition />
      <Derby2Composition />
      <TeaserComposition />
      <ProfileCompositions />
    </>
  );
};
