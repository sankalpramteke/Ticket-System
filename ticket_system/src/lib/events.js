import { EventEmitter } from 'events'

const GLOBAL_KEY = '__ts_event_bus__'

export function getEventBus() {
  if (!global[GLOBAL_KEY]) {
    global[GLOBAL_KEY] = new EventEmitter()
    // Increase max listeners to avoid warnings in dev with HMR
    global[GLOBAL_KEY].setMaxListeners(50)
  }
  return global[GLOBAL_KEY]
}
