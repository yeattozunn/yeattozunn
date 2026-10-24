import { BatrakovComposition, BjkComposition, DerbyComposition, Lille2Composition, MyComposition } from "./Composition";
import { ProfileCompositions } from "./profile";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <DerbyComposition />
      <Lille2Composition />
      <BjkComposition />
      <BatrakovComposition />
      <ProfileCompositions />
    </>
  );
};
