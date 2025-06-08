/**
 * Parses a git diff string and counts the number of lines added and removed.
 * Ignores diff metadata lines (like @@ and +++ lines).
 */
export function parseDiff(diff: string): { additions: number; deletions: number } {
  const lines = diff.split('\n');
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  return { additions, deletions };
}

/**
 * Converts a glob pattern to a RegExp object.
 * Handles common glob patterns like * and ?.
 */
export function globToRegex(pattern: string): RegExp {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*')                  // Convert * to .*
    .replace(/\?/g, '.');                  // Convert ? to .
  return new RegExp(regexStr);
}
