export function generate8DigitNumber(): string {
  return Math.floor(Math.random() * 100_000_000)
    .toString()
    .padStart(8, '0');
}
