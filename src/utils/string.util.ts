export function parseSocialCount(countStr: string | null | undefined): number | null {
  if (!countStr) return null;

  let cleanStr = countStr.replace(/[, ]/g, '').toUpperCase();

  let multiplier = 1;
  if (cleanStr.endsWith('M')) {
    multiplier = 1000000;
    cleanStr = cleanStr.slice(0, -1);
  } else if (cleanStr.endsWith('K')) {
    multiplier = 1000;
    cleanStr = cleanStr.slice(0, -1);
  } else if (cleanStr.endsWith('B')) {
    multiplier = 1000000000;
    cleanStr = cleanStr.slice(0, -1);
  }

  const value = parseFloat(cleanStr);
  if (isNaN(value)) return null;

  return Math.floor(value * multiplier);
}
