// src/common/guards/at.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {}
export class RtGuard extends AuthGuard('jwt-refresh') {}
