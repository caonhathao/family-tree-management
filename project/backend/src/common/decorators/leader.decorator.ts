import { SetMetadata } from '@nestjs/common';

export const IS_LEADER_KEY = 'isLeader';
export const IsLeader = () => SetMetadata(IS_LEADER_KEY, true);
