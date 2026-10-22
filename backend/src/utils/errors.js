// Error HTTP unico del backend. Todo lo que salga de controllers, services o models
// debe usar esta clase: el middleware central de app.js la traduce a { error } con el
// status correspondiente. Los errores sin status se tratan como 500 y NO se filtra
// el detalle interno al cliente.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }

  static badRequest(msg) { return new HttpError(400, msg); }
  static unauthorized(msg) { return new HttpError(401, msg); }
  static forbidden(msg) { return new HttpError(403, msg); }
  static notFound(msg) { return new HttpError(404, msg); }
  static conflict(msg) { return new HttpError(409, msg); }
}

module.exports = { HttpError };
