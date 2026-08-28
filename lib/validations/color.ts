import { z } from 'zod';

/**
 * Hex colour accepted by the admin colour fields.
 *
 * `<input type="color">` always emits the 6-digit lower-case form, but the paired text input
 * lets an admin paste `#FFF`, so both lengths are allowed. Kept in one place because the
 * banner and promotion-bar schemas would otherwise carry their own copy of the pattern and
 * drift apart.
 */
export const hexColor = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Must be a valid hex colour (e.g. #61000B)');
