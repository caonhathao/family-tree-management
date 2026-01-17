export function handleError(err: unknown) {
  let errorMessage = "error";

  if (err instanceof Error) {
    errorMessage = err.message;
  }

  return {
    success: false,
    error: errorMessage,
  };
}
