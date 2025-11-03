let ioRef = null;

export function setIO(io) {
  ioRef = io;
}

export function emit(event, payload) {
  try {
    if (ioRef) ioRef.emit(event, payload);
  } catch {}
}

export function emitTo(room, event, payload) {
  try {
    if (ioRef) ioRef.to(String(room)).emit(event, payload);
  } catch {}
}

export function emitToUser(userId, event, payload) {
  try {
    if (ioRef) ioRef.to(`user:${String(userId)}`).emit(event, payload);
  } catch {}
}

export default { setIO, emit, emitTo, emitToUser };
