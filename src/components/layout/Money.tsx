export function Money({ value }: { value: number }) {
  return <span>${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>;
}