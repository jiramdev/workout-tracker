export function sessionStillValid(tokenVersion: number | undefined, dbVersion: number) {
  return (tokenVersion ?? 0) === dbVersion;
}
