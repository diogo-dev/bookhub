export function get(route: string, token?: string | null) {
  const headers: Record<string, string> = {};

  if(token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(urlOf(route), { headers });
}

export function post(route: string, body?: any, token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(urlOf(route), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export function patch(route: string, body?: any, token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(urlOf(route), {
    method: "PATCH",
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export function del(route: string, token?: string | null) {
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(urlOf(route), {
    method: "DELETE",
    headers,
  });
}

function urlOf(route: string) {
  const connector = route.startsWith("/") ? "" : "/";
  return process.env.NEXT_PUBLIC_API_URL + connector + route;
}
