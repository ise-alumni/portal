/**
 * Array manipulation utilities
 */

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export function uniqueArray<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortByMultiple<T>(array: T[], sortKeys: Array<keyof T>, directions: Array<'asc' | 'desc'>): T[] {
  return [...array].sort((a, b) => {
    for (let i = 0; i < sortKeys.length; i++) {
      const key = sortKeys[i];
      const direction = directions[i] || 'asc';
      const aValue = a[key];
      const bValue = b[key];
      
      let comparison = 0;
      if (aValue === null || aValue === undefined) comparison = -1;
      else if (bValue === null || bValue === undefined) comparison = 1;
      else if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
      
      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}