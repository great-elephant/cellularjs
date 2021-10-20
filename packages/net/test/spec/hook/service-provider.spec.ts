import { afterEach } from 'mocha';
import { createNetWork, cleanNetwork, Hook, Cell, send, CellularIRQ } from '../../../src';
import { EditFooService, Session } from '../../fixture/hook';

describe('Hook - addServiceProviders()', () => {
  beforeEach(async () => {
    @Cell({
      listen: { EditFooService },
    })
    class LocalDriver { }

    await createNetWork([
      { name: 'Provider', driver: LocalDriver },
    ]);
  });

  afterEach(async () => {
    await cleanNetwork();
  })

  it('can add provider for resolving service handler', async () => {
    Hook.addServiceProviders(EditFooService, [Session]);

    const irq = new CellularIRQ({ unicast: 'Provider:EditFooService' });
    await send(irq, { throwOnError: true});
  });
});