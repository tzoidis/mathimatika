/** Every text is NFC, on input and in content files. */
export function normalizeText(text: string): string {
  return text.normalize('NFC');
}
