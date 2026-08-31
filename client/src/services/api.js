/**
 * Mock API Gateway Client.
 * In Phase 2, this will be replaced with Axios configured with baseURL and JWT interceptors.
 */
export async function mockDelay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createApiResponse(data, message = 'Success', meta = null) {
  return {
    success: true,
    data,
    message,
    meta
  };
}

export function createApiError(code, message, details = []) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}
