import { BatrakovComposition, BjkComposition, Derby2Composition, DerbyComposition, TeaserComposition, OzetComposition, HaftaComposition, WonderkidComposition, H10Composition, KgComposition, KadroComposition, ConceptCompositions, EuroCompositions, Lille2Composition, MyComposition } from "./Composition";
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
      <OzetComposition />
      <HaftaComposition />
      <WonderkidComposition />
      <H10Composition />
      <KgComposition />
      <KadroComposition />
      <ConceptCompositions />
      <EuroCompositions />
      <ProfileCompositions />
    </>
  );
};
