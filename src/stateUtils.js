import { writeFile, readFile } from "fs/promises";
import { resolve } from "path";
import { fileURLToPath } from "url";

const statePath = resolve(
  fileURLToPath(import.meta.url),
  "../../state/state.json"
);

/**
 *
 * @param {{lastKnownPhotoId: number; lastProcessedPhotoId: number; lastPhotoIdSentToTelegram: number;}} state
 * @returns
 */
export const writeState = async (state) => {
  if (!state) {
    throw new Error("state is required");
  }

  return writeFile(statePath, JSON.stringify(state, null, 2));
};

/**
 *
 * @returns {Promise<{lastKnownPhotoId: number; lastProcessedPhotoId: number; lastPhotoIdSentToTelegram: number;}>}
 */
export const readState = async () =>
  JSON.parse(await readFile(statePath, "utf-8"));
