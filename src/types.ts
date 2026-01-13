import type { BlockEntity } from '@logseq/libs/dist/LSPlugin';

export type { BlockEntity };

export interface TransformOptions {
  removeTopLevelBullets: boolean;
  keepNestedBullets: boolean;
}
