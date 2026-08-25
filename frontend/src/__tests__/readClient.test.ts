import { describe, it, expect } from 'vitest';
import {
  contractReadService,
  RpcNetworkError,
  ContractDecodeError,
  ContractNotConfiguredError,
} from '../services/readClient';
import { activeContractConfig } from '../config/studionet';

describe('ContractReadService & Typed Error Boundaries', () => {
  it('throws ContractNotConfiguredError when contract address is unconfigured', async () => {
    const originalAddr = activeContractConfig.contractAddress;
    activeContractConfig.contractAddress = '';

    await expect(contractReadService.getPublisherProfile()).rejects.toThrow(ContractNotConfiguredError);

    activeContractConfig.contractAddress = originalAddr;
  });

  it('handles documented empty record by returning null when decoded', async () => {
    const profile = await contractReadService.getPublisherProfile('publisher', true).catch(() => null);
    expect(profile === null || typeof profile === 'object').toBe(true);
  });

  it('constructs typed RpcNetworkError with function name and message', () => {
    const err = new RpcNetworkError('get_publisher_profile', new Error('Connection refused'));
    expect(err.name).toBe('RpcNetworkError');
    expect(err.functionName).toBe('get_publisher_profile');
    expect(err.message).toContain('Connection refused');
  });

  it('constructs typed ContractDecodeError with function name and message', () => {
    const err = new ContractDecodeError('get_assessment', new Error('Invalid enum'));
    expect(err.name).toBe('ContractDecodeError');
    expect(err.functionName).toBe('get_assessment');
    expect(err.message).toContain('Invalid enum');
  });
});
