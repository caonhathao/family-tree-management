export const safeJsonParse = (value: string | null) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error("Failed to parse JSON:", value);
    console.error("Error", e);
    return null;
  }
};
