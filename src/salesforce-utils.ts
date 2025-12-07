/**
 * Converts a 15-character Salesforce ID to an 18-character case-safe ID.
 *
 * The 18-character format includes a 3-character checksum that makes the ID
 * case-insensitive. This is the standard Salesforce ID conversion algorithm.
 *
 * @param id15 - The 15-character Salesforce ID
 * @returns The 18-character case-safe Salesforce ID
 * @throws Error if the input is not a valid 15-character ID
 */
export function convertTo18CharId(id15: string): string {
  // Validate input
  if (!id15 || id15.length !== 15) {
    throw new Error('Salesforce ID must be exactly 15 characters');
  }

  // The alphabet used for checksum characters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

  let suffix = '';

  // Process the ID in three chunks of 5 characters each
  for (let i = 0; i < 3; i++) {
    let flags = 0;

    // For each character in this chunk
    for (let j = 0; j < 5; j++) {
      const char = id15.charAt(i * 5 + j);

      // If the character is uppercase, set the corresponding bit
      if (char >= 'A' && char <= 'Z') {
        flags += 1 << j;  // Bit shift to set the correct bit position
      }
    }

    // Convert the 5-bit flags to a character from the alphabet
    suffix += alphabet.charAt(flags);
  }

  return id15 + suffix;
}

/**
 * Validates and converts a Salesforce ID to 18-character format if needed.
 * If already 18 characters, returns as-is. If 15 characters, converts to 18.
 *
 * @param id - The Salesforce ID (15 or 18 characters)
 * @returns The 18-character Salesforce ID
 * @throws Error if the input is not a valid 15 or 18 character ID
 */
export function ensureId18(id: string): string {
  if (!id) {
    throw new Error('Salesforce ID cannot be empty');
  }

  if (id.length === 18) {
    return id;
  }

  if (id.length === 15) {
    return convertTo18CharId(id);
  }

  throw new Error(`Invalid Salesforce ID length: ${id.length}. Must be 15 or 18 characters.`);
}
