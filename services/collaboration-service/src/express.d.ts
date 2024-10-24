declare namespace Express {
  export interface Response {
    superjson(data: unknown): void;
    sendError(statusCodes: import("http-status-codes").StatusCodes, message: string): void;
  }
}
