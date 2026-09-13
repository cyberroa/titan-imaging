import { ApiError, getApiBaseUrl } from "@/lib/api";

type GqlError = { message: string };

export async function graphqlQuery<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const url = `${getApiBaseUrl()}/api/v1/graphql`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: T;
    errors?: GqlError[];
  };
  if (!res.ok) {
    throw new ApiError(`GraphQL request failed (${res.status})`, res.status, body);
  }
  if (body.errors?.length) {
    throw new ApiError(body.errors.map((e) => e.message).join("; "), res.status, body);
  }
  if (body.data === undefined) {
    throw new ApiError("GraphQL returned no data", res.status, body);
  }
  return body.data;
}
