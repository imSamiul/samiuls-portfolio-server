// Thrown by services and middleware so the central error handler can turn a
// failure into the right status code instead of every controller guessing.
export default class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
