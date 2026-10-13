export default async function handler(request, response) {
  const startTime = Date.now();

  const aadhaar = request.query.aadhaar;
  const apikey = request.query.key;

  // 🔑 Key check
  if (!apikey) {
    return response.status(401).json({ 
      message: "Provide correct key",
      contact: "@dmforbans"
    });
  }

  // 🔑 Valid Keys
  // 📅 Expiry: 25 October 2026
  const VALID_KEYS = {
    "M9K4P7X2R8QZ5W": { expires: 1792866600000 }
  };

  const keyInfo = VALID_KEYS[apikey];

  if (!keyInfo) {
    return response.status(403).json({ 
      message: "Provide correct key",
      contact: "@dmforbans"
    });
  }

  // ⏰ Expire check
  const now = Date.now();
  if (now > keyInfo.expires) {
    const expiryDate = new Date(keyInfo.expires).toISOString().split("T")[0];
    return response.status(403).json({ 
      message: "Your API key expired",
      expired_on: expiryDate,
      contact: "@dmforbans"
    });
  }

  const expiryDate = new Date(keyInfo.expires).toISOString().split("T")[0];

  // 🔍 Aadhaar check
  if (!aadhaar) {
    return response.status(400).json({ 
      message: "Provide valid 12 digit aadhaar number",
      contact: "@dmforbans"
    });
  }

  if (!/^\d{12}$/.test(aadhaar)) {
    return response.status(400).json({ 
      message: "Provide valid 12 digit aadhaar number",
      contact: "@dmforbans"
    });
  }

  // 🌐 Upstream API call
  const apiUrl = `https://aadhaar-family.asurpapa.workers.dev/api?key=@ASUR_ABOUT&aadhaar=${encodeURIComponent(aadhaar)}`;

  try {
    const apiResponse = await fetch(apiUrl);

    const responseTimeMs = Date.now() - startTime;
    const responseTimeSec = (responseTimeMs / 1000).toFixed(3);

    if (!apiResponse.ok) {
      return response.status(404).json({ 
        query: aadhaar,
        type: "aadhaar",
        response_time_ms: responseTimeMs,
        response_time: responseTimeSec + "s",
        key_expires_on: expiryDate,
        developer: "@dmforbans",
        data: null,
        message: "Data not found"
      });
    }

    let data = await apiResponse.json();

    // 🧹 Credit हटाओ (हर level पर)
    data = removeCredits(data);

    // ❌ Data नहीं मिला
    if (!data || !data.data || data.data.length === 0) {
      return response.status(404).json({ 
        query: aadhaar,
        type: "aadhaar",
        response_time_ms: responseTimeMs,
        response_time: responseTimeSec + "s",
        key_expires_on: expiryDate,
        developer: "@dmforbans",
        data: null,
        message: "Data not found"
      });
    }

    // ✅ पूरा response
    return response.status(200).json({
      query: aadhaar,
      type: "aadhaar",
      response_time_ms: responseTimeMs,
      response_time: responseTimeSec + "s",
      key_expires_on: expiryDate,
      developer: "@dmforbans",
      data: data
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const responseTimeSec = (responseTimeMs / 1000).toFixed(3);

    return response.status(500).json({ 
      query: aadhaar,
      type: "aadhaar",
      response_time_ms: responseTimeMs,
      response_time: responseTimeSec + "s",
      key_expires_on: expiryDate,
      developer: "@dmforbans",
      data: null,
      message: "Data not found"
    });
  }
}

// 🧹 Credit हटाने का function (सब जगह से)
function removeCredits(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(item => removeCredits(item));

  const cleaned = {};
  for (const key in obj) {
    const lowerKey = key.toLowerCase();

    // ये fields skip
    if (
      lowerKey === "credit" || lowerKey === "credits" ||
      lowerKey === "developer" || lowerKey === "developed_by" ||
      lowerKey === "author" || lowerKey === "created_by" ||
      lowerKey === "powered_by" || lowerKey === "poweredby" ||
      lowerKey === "source" || lowerKey === "src" ||
      lowerKey === "footer" || lowerKey === "contact" ||
      lowerKey === "asur" || lowerKey === "asurpapa" ||
      lowerKey === "asur_about" || lowerKey === "name"
    ) {
      continue;
    }

    // Value में ASUR, telegram link हो तो skip
    if (typeof obj[key] === "string") {
      const valueLower = obj[key].toLowerCase();
      if (
        valueLower.includes("asur") ||
        valueLower.includes("t.me/") ||
        valueLower.includes("telegram") ||
        valueLower.includes("@asur") ||
        valueLower.includes("powered by") ||
        valueLower.includes("hi teck") ||
        valueLower.includes("hiteck")
      ) {
        continue;
      }
    }

    cleaned[key] = removeCredits(obj[key]);
  }
  return cleaned;
      }
