export default class InternalError extends Error {
  public status: number;
  public name = 'InternalError';

  public constructor(message: string, status = 500) {
    super();

    this.message = message;
    this.status = status;
  }
}
