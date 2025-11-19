export function get(route: string) {
  return fetch(urlOf(route));
}

export function post(route: string, body?: any) {
  return fetch(urlOf(route), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function urlOf(route: string) {
  const connector = route.startsWith("/") ? "" : "/";
  return process.env.NEXT_PUBLIC_API_URL + connector + route;
}
