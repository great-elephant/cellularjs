import {
  getResolvedCell, ServiceHandler,
  CellContext, IRQ,
  Errors, CLL_NET_HANDLER,
} from '..';
import { scopeContraints } from '../scope';
import { getServiceProviders, getServiceProxies } from '../service-helper';
import { getServiceMeta } from '../utils';
import { Container, GenericProvider } from '@cellularjs/di';
import { ResolvedDriver } from 'type';

export async function resolveServiceHandler(
  irq: IRQ,
  refererCell: CellContext,
  driverType: string,
): Promise<ServiceHandler> {
  const [destCellName, eventName] = irq.header.to.split(':');
  const destResolvedCell = getResolvedCell(destCellName);

  if (!destResolvedCell) {
    throw Errors.NoResolvedCell(destCellName, driverType);
  }

  const resolvedDriver = destResolvedCell.drivers.get(driverType);
  if (!resolvedDriver) {
    throw Errors.NoResolvedDriver(driverType, irq.header.to);
  }

  const DestServiceHandler = resolvedDriver.listener.get(eventName);
  if (!DestServiceHandler) {
    throw Errors.NoServiceHandler(driverType, irq.header.to);
  }

  const serviceMeta = getServiceMeta(DestServiceHandler);

  // DO: check event scope constraint
  scopeContraints[serviceMeta.scope](destResolvedCell, refererCell);
  const serviceProviders = getServiceProviders(DestServiceHandler);
  const providers: GenericProvider<any>[] = [
    ...serviceProviders,
    { token: IRQ, useValue: irq },
  ];

  const global = new Container();
  global.addProviders(providers)
  const eventHandler = await resolvedDriver.container.resolve<ServiceHandler>(
    DestServiceHandler, { global },
  );

  const proxyClasses = getServiceProxies(DestServiceHandler);
  if (!proxyClasses.length) {
    return eventHandler;
  }

  return resolveProxyInstance(resolvedDriver, providers, proxyClasses, eventHandler);
}

async function resolveProxyInstance(
  resolvedDriver: ResolvedDriver,
  providers: GenericProvider<any>[],
  proxyClasses: { new(...args: any[]): ServiceHandler }[],
  eventHandler: ServiceHandler,
) {
  let proxyInstance: ServiceHandler;

  for (let i = 0; i < proxyClasses.length; i++) {
    const proxyClass = proxyClasses[i];
    const extModule = new Container();

    extModule.addProviders(providers.concat([
      { token: CLL_NET_HANDLER, useValue: proxyInstance || eventHandler },
      { token: proxyClass, useClass: proxyClass },
    ]));

    proxyInstance = await resolvedDriver.container.resolve(proxyClass, { extModule });
  }

  return proxyInstance;
}