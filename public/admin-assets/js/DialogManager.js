let zIndexCounter = 7;

export const getNextZIndex = () => ++zIndexCounter;
export const resetZIndex = () => { zIndexCounter = 7; };