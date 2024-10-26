import { getTestConfig } from 'common/config';

describe('Sample test', () => {
  it('loads test config', () => {
    const config = getTestConfig();
    expect(config.isTest).toBe(true);
  });
});
