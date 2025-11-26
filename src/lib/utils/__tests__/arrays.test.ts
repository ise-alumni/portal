import { describe, it, expect } from 'vitest';
import { 
  chunkArray, 
  uniqueArray, 
  groupBy, 
  sortByMultiple, 
  shuffleArray 
} from '../arrays';

describe('Array Utilities', () => {
  describe('chunkArray', () => {
    it('should chunk array into specified size', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = chunkArray(arr, 3);
      
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    });

    it('should handle array smaller than chunk size', () => {
      const arr = [1, 2];
      const result = chunkArray(arr, 5);
      
      expect(result).toEqual([[1, 2]]);
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      const result = chunkArray(arr, 3);
      
      expect(result).toEqual([]);
    });
  });

  describe('uniqueArray', () => {
    it('should return unique values', () => {
      const arr = [1, 2, 2, 3, 1, 4];
      const result = uniqueArray(arr);
      
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should return unique objects by key', () => {
      const arr = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 1, name: 'John' }
      ];
      const result = uniqueArray(arr, 'id');
      
      expect(result).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]);
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const arr = [
        { type: 'fruit', name: 'Apple' },
        { type: 'vegetable', name: 'Carrot' },
        { type: 'fruit', name: 'Banana' }
      ];
      const result = groupBy(arr, 'type');
      
      expect(result).toEqual({
        fruit: [
          { type: 'fruit', name: 'Apple' },
          { type: 'fruit', name: 'Banana' }
        ],
        vegetable: [
          { type: 'vegetable', name: 'Carrot' }
        ]
      });
    });
  });

  describe('sortByMultiple', () => {
    it('should sort by multiple keys', () => {
      const arr = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 20 },
        { name: 'Bob', age: 30 }
      ];
      const result = sortByMultiple(arr, ['age', 'name'], ['asc', 'asc']);
      
      expect(result).toEqual([
        { name: 'Jane', age: 20 },
        { name: 'John', age: 25 },
        { name: 'Bob', age: 30 }
      ]);
    });

    it('should handle descending sort', () => {
      const arr = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 20 },
        { name: 'Bob', age: 30 }
      ];
      const result = sortByMultiple(arr, ['age'], ['desc']);
      
      expect(result).toEqual([
        { name: 'Bob', age: 30 },
        { name: 'John', age: 25 },
        { name: 'Jane', age: 20 }
      ]);
    });
  });

  describe('shuffleArray', () => {
    it('should shuffle array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffleArray(arr);
      
      expect(result).toHaveLength(5);
      expect(result).toEqual(expect.arrayContaining(arr));
      expect(result).not.toEqual(arr); // Should be different order
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      const result = shuffleArray(arr);
      
      expect(result).toEqual([]);
    });
  });
});