import type { Profile } from "@/lib/migration";

export type CheckProfileUpdate = <Key extends keyof Profile>(
  key: Key,
  value: Profile[Key],
) => void;

export type CheckStepProps = {
  profile: Profile;
  update: CheckProfileUpdate;
  asOf: string;
};
