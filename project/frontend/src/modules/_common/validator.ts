import { Exception } from "@/lib/messages/response.messages";
import { validate as isUUID } from "uuid";

export const validator = async <T>(
  id: string,
  findFn: (id: string) => Promise<T>,
): Promise<T> => {
  if (!id) throw new Error(Exception.ID_MISSING);
  if (!isUUID(id)) throw new Error(Exception.ID_INVALID);

  const result = await findFn(id);

  if (!result) throw new Error(Exception.NOT_EXIST);
  return result;
};
