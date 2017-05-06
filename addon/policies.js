export function drop ({ isFull, signal }) {
  if (!isFull) {
    return signal;
  }
}

export function queue ({isFull, signal, queue }) {
  if (isFull) {
    queue.push(signal);
  } else {
    return signal;
  }
}