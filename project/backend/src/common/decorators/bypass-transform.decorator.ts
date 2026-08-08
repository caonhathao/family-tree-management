// src/common/decorators/bypass-transform.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const BYPASS_TRANSFORM_KEY = 'bypass_transform';

/**
 * Marks an endpoint (method or controller) so the global TransformInterceptor
 * leaves the returned value untouched. Use for raw payloads such as file
 * downloads, streams, or endpoints that manage their own response body.
 *
 * @example
 * @Get('download')
 * @BypassTransform()
 * download() {
 *   return new StreamableFile(buffer);
 * }
 */
export const BypassTransform = () => SetMetadata(BYPASS_TRANSFORM_KEY, true);
