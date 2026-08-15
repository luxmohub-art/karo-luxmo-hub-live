// LUXMO HUB - Admin OTP Request API
// /api/admin-send-otp.js
//
// Production requirements:
// - UPSTASH_REDIS_REST_URL
// - UPSTASH_REDIS_REST_TOKEN
// - ADMIN_EMAIL
// - ADMIN_MOBILE
// - OTP_SECRET
// - RESEND_API_KEY
// - TWILIO_ACCOUNT_SID
// - TWILIO_AUTH_TOKEN
// - TWILIO_PHONE_NUMBER
//
// OTP is stored server-side in Redis.
// Never expose OTP_SECRET or provider credentials to frontend.

import crypto from "crypto";

const OTP_TTL_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_SECONDS = 60;

function json(res, status, data) {
  return res.status(status).json(data);
}

function getEnv(name) {
  return String(process.env[name] || "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeMobile(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";

  // India: convert 10-digit number to +91XXXXXXXXXX
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidMobile(mobile) {
  return /^\+[1-9]\d{9,14}$/.test(mobile);
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  const secret = getEnv("OTP_SECRET");

  if (!secret) {
    throw new Error("OTP_SECRET is not configured");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(otp)
    .digest("hex");
}

async function redisCommand(command) {
  const url = getEnv("UPSTASH_REDIS_REST_URL");
  const token = getEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    throw new Error("Redis environment variables are not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Redis request failed: ${response.status}`);
  }

  return response.json();
}

async function sendEmailOtp(email, otp) {
  const resendKey = getEnv("RESEND_API_KEY");

  if (!resendKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEnv("ADMIN_OTP_FROM_EMAIL") || "LUXMO HUB <onboarding@resend.dev>",
      to: [email],
      subject: "LUXMO HUB Admin Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
          <h2>LUXMO HUB Admin Login</h2>
          <p>Your administrator verification OTP is:</p>

          <div style="
            font-size:32px;
            font-weight:700;
            letter-spacing:8px;
            padding:18px;
            background:#f4f4f4;
            text-align:center;
            border-radius:10px;
          ">
            ${otp}
          </div>

          <p>This OTP expires in <strong>5 minutes</strong>.</p>

          <p>
            If you did not request this login, ignore this email.
          </p>

          <hr />

          <small>
            LUXMO HUB Admin Security
          </small>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider failed: ${body}`);
  }
}

async function sendSmsOtp(mobile, otp) {
  const sid = getEnv("TWILIO_ACCOUNT_SID");
  const token = getEnv("TWILIO_AUTH_TOKEN");
  const from = getEnv("TWILIO_PHONE_NUMBER");

  if (!sid || !token || !from) {
    throw new Error("SMS provider is not configured");
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const body = new URLSearchParams({
    To: mobile,
    From: from,
    Body: `LUXMO HUB Admin OTP: ${otp}. Valid for 5 minutes. Do not share this OTP.`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SMS provider failed: ${errorText}`);
  }
}

function maskEmail(email) {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return "***";
  }

  const visible = name.length <= 2 ? name[0] : name.slice(0, 2);

  return `${visible}***@${domain}`;
}

function maskMobile(mobile) {
  if (!mobile) return "***";

  const digits = mobile.replace(/\D/g, "");

  if (digits.length < 4) {
    return "***";
  }

  return `******${digits.slice(-4)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return json(res, 405, {
      success: false,
      error: "Method not allowed.",
    });
  }

  try {
    const configuredEmail = normalizeEmail(getEnv("ADMIN_EMAIL"));
    const configuredMobile = normalizeMobile(getEnv("ADMIN_MOBILE"));

    if (!configuredEmail || !isValidEmail(configuredEmail)) {
      return json(res, 500, {
        success: false,
        error: "Admin email is not configured correctly.",
      });
    }

    if (!configuredMobile || !isValidMobile(configuredMobile)) {
      return json(res, 500, {
        success: false,
        error: "Admin mobile is not configured correctly.",
      });
    }

    const body = req.body || {};

    const email = normalizeEmail(body.email);
    const mobile = normalizeMobile(body.mobile);

    // Both admin identifiers must match.
    if (
      !email ||
      !mobile ||
      email !== configuredEmail ||
      mobile !== configuredMobile
    ) {
      // Generic response prevents account enumeration.
      return json(res, 200, {
        success: true,
        message: "If the details are authorized, an OTP will be sent.",
      });
    }

    const rateKey = `luxmo:admin:otp:rate:${email}`;

    const rateResult = await redisCommand([
      "SET",
      rateKey,
      "1",
      "EX",
      RATE_LIMIT_SECONDS,
      "NX",
    ]);

    if (rateResult.result !== "OK") {
      return json(res, 429, {
        success: false,
        error: "Please wait before requesting another OTP.",
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const challengeId = crypto.randomBytes(32).toString("hex");

    const otpKey = `luxmo:admin:otp:${challengeId}`;

    await redisCommand([
      "SET",
      otpKey,
      JSON.stringify({
        otpHash,
        email,
        mobile,
        attempts: 0,
        createdAt: Date.now(),
      }),
      "EX",
      OTP_TTL_SECONDS,
    ]);

    // Send both channels.
    await Promise.all([
      sendEmailOtp(email, otp),
      sendSmsOtp(mobile, otp),
    ]);

    // Challenge ID is not the OTP.
    return json(res, 200, {
      success: true,
      message: "OTP sent successfully.",
      challengeId,
      expiresIn: OTP_TTL_SECONDS,
      delivery: {
        email: maskEmail(email),
        mobile: maskMobile(mobile),
      },
    });
  } catch (error) {
    console.error("admin-send-otp error:", error);

    return json(res, 500, {
      success: false,
      error: "Unable to send OTP. Please try again later.",
    });
  }
}
