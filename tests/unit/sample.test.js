/**
 * Sample unit test to verify Jest setup
 */

describe('Sample Test Suite', () => {
    test('adds 1 + 2 to equal 3', () => {
      expect(1 + 2).toBe(3);
    });
    
    test('handles async operations', async () => {
      const result = await Promise.resolve('success');
      expect(result).toBe('success');
    });
    
    test('mocks functions correctly', () => {
      const mockFn = jest.fn().mockReturnValue(42);
      expect(mockFn()).toBe(42);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });