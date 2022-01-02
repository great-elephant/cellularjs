import {
  Service,
  ServiceHandler,
  send,
  IRQ,
  CellContext,
} from '../../../../../src';

@Service({ scope: 'publish' })
export class DelegateCacheHtml implements ServiceHandler {
  constructor(private ctx: CellContext) {}

  handle() {
    const cacheHtmlIrq = new IRQ({ to: 'IMS:CacheHtml' });

    return send(cacheHtmlIrq, {
      refererCell: this.ctx,
      throwOriginalError: true,
    });
  }
}
