import { IErrorResponse } from "@/types/base.types";

export function handleError(err: unknown) {
  let errorMessage = "error";

  if (err instanceof Error) {
    errorMessage = err.message;
  }

  return {
    success: false,
    error: errorMessage,
  } as IErrorResponse;
}

export const safeJsonParse = (value: string | null) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error("Failed to parse JSON:", value);
    return null;
  }
};
