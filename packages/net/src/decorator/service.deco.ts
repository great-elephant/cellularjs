import { ServiceMeta, ServiceScopeMap, AjustedServiceMeta } from '../internal';
import { CLL_SERVICE_OPTS } from '..';

/**
 * Mark a class as event handler.
 */
export const Service = (eventMeta?: ServiceMeta) => (target) => {
  const meta = eventMeta || {};

  const adjustedMeta: AjustedServiceMeta = {
    ...meta,
    scope: ServiceScopeMap[meta.scope] || ServiceScopeMap.space,
  };

  Reflect.defineMetadata(CLL_SERVICE_OPTS, adjustedMeta, target);

  return target;
}