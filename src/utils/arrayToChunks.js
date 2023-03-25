/**
 *
 * @param {Array<any>} array
 * @param {number} chunkSize
 * @returns {Array<Array<any>>}
 */
export const arrayToChunks = (array, chunkSize) =>
  array.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / chunkSize);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
