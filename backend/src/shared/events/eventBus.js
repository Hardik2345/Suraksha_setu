const listenersByEvent = new Map();

function subscribe(eventName, listener) {
  const listeners = listenersByEvent.get(eventName) || new Set();
  listeners.add(listener);
  listenersByEvent.set(eventName, listeners);

  return () => {
    const currentListeners = listenersByEvent.get(eventName);
    if (!currentListeners) return;
    currentListeners.delete(listener);
    if (currentListeners.size === 0) {
      listenersByEvent.delete(eventName);
    }
  };
}

async function publish(eventName, payload) {
  const listeners = listenersByEvent.get(eventName);
  if (!listeners || listeners.size === 0) return;

  await Promise.allSettled(
    Array.from(listeners).map((listener) => Promise.resolve(listener(payload)))
  );
}

module.exports = {
  subscribe,
  publish,
};
