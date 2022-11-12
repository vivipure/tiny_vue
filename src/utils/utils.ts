export function isEqual(a: any, b: any) {
  if (isNaN(a)) {
    return isNaN(a) === isNaN(b);
  }
  return a === b;
}
