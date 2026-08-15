const COOKIE_NAME = "luxmo_admin_session";

function sendJson(res, status, data) {
  res.status(status).json(data);
}

export default function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");

    return sendJson(res, 405, {
      success: false,
      error: "Method not allowed.",
    });
  }

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );

  return sendJson(res, 200, {
    success: true,
    authenticated: false,
    message: "Admin logged out successfully.",
  });
}
