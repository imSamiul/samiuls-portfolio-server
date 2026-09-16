export interface ApiSuccessResponse<TData> {
  success: true;
  message: string;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  stack?: string;
}
