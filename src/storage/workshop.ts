// What the Workshop offers next. Pure, so the rules can be tested without a database.
//
// The items come room by room, in the catalogue's order: the Workshop, then the yard,
// the harbour and the observatory. A later room's things cost more stars, so the
// catalogue lasts a school year; the rooms already filled stay to visit.

export interface Room {
  id: string;
  price: number;
}

export interface Item {
  id: string;
  room: string;
}

/** Two items to pick from, in the catalogue's order, when the stars allow one. */
export function nextChoices(all: readonly string[], owned: readonly string[], stars: number, price: number): string[] {
  if (stars < price) return [];
  return all.filter((id) => !owned.includes(id)).slice(0, 2);
}

/** The room being filled now: the first with something left in it, or the last. */
export function currentRoom(rooms: readonly Room[], items: readonly Item[], owned: readonly string[]): Room {
  return rooms.find((r) => items.some((i) => i.room === r.id && !owned.includes(i.id))) ?? rooms[rooms.length - 1]!;
}

/** The rooms that can be visited: every one up to the current room. */
export function openRooms(rooms: readonly Room[], items: readonly Item[], owned: readonly string[]): Room[] {
  const current = currentRoom(rooms, items, owned);
  return rooms.slice(0, rooms.indexOf(current) + 1);
}

/** What the current room offers: two of its items, at its price. */
export function roomChoices(rooms: readonly Room[], items: readonly Item[], owned: readonly string[], stars: number): { room: Room; choices: string[] } {
  const room = currentRoom(rooms, items, owned);
  const inRoom = items.filter((i) => i.room === room.id).map((i) => i.id);
  return { room, choices: nextChoices(inRoom, owned, stars, room.price) };
}

/** True when the child has just moved: the current room is not the first and nothing in it is theirs yet. */
export function justMoved(rooms: readonly Room[], items: readonly Item[], owned: readonly string[]): boolean {
  const room = currentRoom(rooms, items, owned);
  return room !== rooms[0] && !items.some((i) => i.room === room.id && owned.includes(i.id));
}
