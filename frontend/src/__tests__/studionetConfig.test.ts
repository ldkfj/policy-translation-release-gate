import { describe, expect, it } from 'vitest';
import { validateContractAddress } from '../config/studionet';

describe('Studionet contract configuration', () => {
  it('preserves the deployed checksum address for RPC lookup', () => {
    const address = '0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75';
    expect(validateContractAddress(address)).toEqual({
      isConfigured: true,
      contractAddress: address,
      configError: null,
    });
  });
});
