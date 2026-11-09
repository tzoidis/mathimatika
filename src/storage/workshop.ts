// What the Workshop offers next. Pure, so the rules can be tested without a database.

/** Two items to pick from, in the catalogue's order, when the stars allow one. */
export function nextChoices(all: readonly string[], owned: readonly string[], stars: number, price: number): string[] {
  if (stars < price) return [];
  return all.filter((id) => !owned.includes(id)).slice(0, 2);
}
