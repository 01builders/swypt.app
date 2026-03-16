const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (url.pathname === "/api/subscribe") {
			if (request.method === "OPTIONS") {
				return new Response(null, { status: 204, headers: CORS_HEADERS });
			}
			if (request.method === "POST") {
				return handleSubscribe(request, env);
			}
		}

		// Redirect pitch.swypt.app → swypt.app/pitch/
		if (url.hostname === "pitch.swypt.app") {
			// Purge any stale CDN cache entry via the Cache API
			const cache = caches.default;
			await cache.delete(request);

			url.hostname = "swypt.app";
			url.pathname = "/pitch" + url.pathname;
			return new Response(null, {
				status: 301,
				headers: {
					"Location": url.toString(),
					"Cache-Control": "no-store",
				},
			});
		}

		const response = await env.ASSETS.fetch(request);

		const headers = new Headers(response.headers);
		headers.set("X-Frame-Options", "DENY");
		headers.set("X-Content-Type-Options", "nosniff");
		headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
		headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

		return new Response(response.body, {
			status: response.status,
			headers,
		});
	},
};

async function handleSubscribe(request, env) {
	const { email } = await request.json();
	if (!email || !email.includes("@")) {
		return new Response(JSON.stringify({ error: "Invalid email" }), {
			status: 400,
			headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
		});
	}

	const res = await fetch("https://api.sender.net/v2/subscribers", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${env.SENDER_API_TOKEN}`,
			Accept: "application/json",
		},
		body: JSON.stringify({ email }),
	});

	return new Response(res.body, {
		status: res.status,
		headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
	});
}
