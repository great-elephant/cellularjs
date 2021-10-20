import 'mocha';
import { expect } from 'chai';
import { DEFAULT_DRIVER, createNetWork, cleanNetwork, getResolvedCell } from '../../../../src';
import { userCellCnf } from '../../../fixture/share/network';
import { UserRepo } from '../../../fixture/cells/user/services/user.repo';

describe('Decorator - @Cell annotation - providers property:', () => {
  beforeEach(async () => {
    await cleanNetwork();
  });

  it('can make use of @cellularjs/di to add providers', async () => {
    await createNetWork([userCellCnf]);

    const resolvedCell = getResolvedCell('User');
    const localDriver = resolvedCell.drivers.get(DEFAULT_DRIVER);

    const userRepo = await localDriver.container.resolve<UserRepo>(UserRepo);

    expect(userRepo).to.instanceOf(UserRepo);
  });
});