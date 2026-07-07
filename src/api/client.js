// api/client.js - COMPLETE FIXED VERSION (DO NOT UNWRAP)
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

// Get the correct base URL for React Native
const getBaseUrl = () => {
  // First check if we have a custom URL from environment
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.log(
      "Using custom API URL from env:",
      process.env.EXPO_PUBLIC_API_BASE_URL,
    );
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // For local development
  if (Platform.OS === "android") {
    // Android emulator uses 10.0.2.2 to access localhost
    return "http://10.0.2.2:8000/api";
  } else if (Platform.OS === "ios") {
    // iOS simulator uses localhost
    return "http://localhost:8000/api";
  }

  // For physical devices, use your computer's IP address
  // Run `ipconfig` on Windows or `ifconfig` on Mac/Linux to find your IP
  // return 'http://192.168.1.100:8000/api';
  return "http://localhost:8000/api";
};

const API_BASE_URL = getBaseUrl();

console.log("🚀 API Base URL:", API_BASE_URL);

// Create axios instance with increased limits
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  maxContentLength: 50 * 1024 * 1024,
  maxBodyLength: 50 * 1024 * 1024,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// ✅ FIX: Better transformResponse that handles all cases without truncation
apiClient.defaults.transformResponse = [
  (data) => {
    // If data is empty or not a string, return as is
    if (!data || typeof data !== "string") {
      return data;
    }

    // Trim whitespace
    const trimmed = data.trim();

    // If empty string, return empty object
    if (trimmed === "") {
      return {};
    }

    // Log response size for debugging
    console.log(`📄 Response size: ${data.length} characters`);

    // Check if response might be truncated
    const lastChar = trimmed.charAt(trimmed.length - 1);
    if (lastChar !== "}" && lastChar !== "]") {
      console.warn(`⚠️ Response may be truncated (ends with "${lastChar}")`);
      console.warn(
        `📄 Last 100 chars: ${trimmed.substring(Math.max(0, trimmed.length - 100))}`,
      );
    }

    // Try to parse JSON
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.error("❌ JSON Parse Error:", e.message);
      console.error("📄 Error at position:", e.position || "unknown");
      console.error(
        "📄 Problem area:",
        trimmed.substring(
          Math.max(0, e.position - 50 || 0),
          e.position + 50 || trimmed.length,
        ),
      );

      // Only try to fix if it looks like truncated JSON (missing closing brackets)
      let fixed = trimmed;

      // Fix: Missing closing brackets only (common truncation issue)
      let openBraces = (fixed.match(/{/g) || []).length;
      let closeBraces = (fixed.match(/}/g) || []).length;
      let openBrackets = (fixed.match(/\[/g) || []).length;
      let closeBrackets = (fixed.match(/\]/g) || []).length;

      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixed += "}";
        }
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixed += "]";
        }

        try {
          console.log(
            "🔧 Attempting to parse fixed JSON (added missing brackets)...",
          );
          const parsed = JSON.parse(fixed);
          console.log("✅ Successfully parsed fixed JSON");
          return parsed;
        } catch (e2) {
          console.error("❌ Failed to fix JSON, returning raw data");
          return trimmed;
        }
      } else {
        console.error(
          "❌ JSON structure appears complete but invalid, returning raw data",
        );
        return trimmed;
      }
    }
  },
];

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    console.log("📤 API Request:", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      params: config.params,
    });

    // ✅ Add cache-busting headers and params
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";

    // Add cache-busting query parameter for GET requests
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Try to get token from AsyncStorage
    try {
      const authStorage = await AsyncStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        const token = parsed.state?.token || parsed.token;
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("🔐 Token added to request");
        }
      }

      // Also check for direct token
      const directToken = await AsyncStorage.getItem("auth_token");
      if (directToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${directToken}`;
        console.log("🔐 Direct token added to request");
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }

    return config;
  },
  (error) => {
    console.error("📤 Request Error:", error);
    return Promise.reject(error);
  },
);

// ✅ FIXED: Response interceptor - KEEP original structure (DO NOT UNWRAP)
apiClient.interceptors.response.use(
  async (response) => {
    console.log("✅ API Response:", {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      hasData: !!response.data,
      dataLength:
        typeof response.data === "string" ? response.data.length : "N/A",
    });

    // If response.data is a string, try to parse it
    if (typeof response.data === "string" && response.data.length > 0) {
      try {
        response.data = JSON.parse(response.data);
        console.log("✅ Parsed string response to JSON");
      } catch (e) {
        console.warn("⚠️ Could not parse response as JSON:", e.message);
      }
    }

    // If response.data is null or undefined, set to empty object
    if (!response.data) {
      response.data = {};
    }

    // ✅ DON'T UNWRAP - let the store handle the data extraction
    // This preserves the original response structure with status, message, etc.
    console.log("📦 Keeping response structure intact for store to handle");
    console.log("📦 Response data keys:", Object.keys(response.data || {}));

    return response;
  },
  async (error) => {
    console.error("❌ API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
      dataType: typeof error.response?.data,
    });

    if (error.response?.status === 401) {
      console.log("🔒 Unauthorized, clearing auth...");
      await AsyncStorage.removeItem("auth-storage");
      await AsyncStorage.removeItem("auth_token");
    }

    // If error response is a string, try to parse it
    if (
      typeof error.response?.data === "string" &&
      error.response.data.length > 0
    ) {
      try {
        error.response.data = JSON.parse(error.response.data);
      } catch (e) {
        // Keep as string
      }
    }

    throw {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred",
      data: error.response?.data || null,
    };
  },
);

// ✅ FIXED: unwrapApiResponse - handles already unwrapped data
export const unwrapApiResponse = (response) => {
  if (!response || !response.data) {
    return response;
  }

  const data = response.data;

  if (typeof data === "object" && "status" in data && "data" in data) {
    if (data.status === true || data.status === "success") {
      return {
        ...response,
        data: data.data,
      };
    } else {
      throw {
        status: data.status || 400,
        message: data.message || "API returned error",
        errors: data.errors || null,
      };
    }
  }

  return response;
};

// ✅ FIXED: getPaginatedData - handles already unwrapped data without double parsing
export const getPaginatedData = (response) => {
  try {
    if (!response) {
      return {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 15,
        next_page_url: null,
        prev_page_url: null,
        first_page_url: null,
        last_page_url: null,
        path: null,
        from: null,
        to: null,
      };
    }

    let dataObj = response.data || response;

    if (typeof dataObj === 'string') {
      try {
        dataObj = JSON.parse(dataObj);
      } catch (e) {
        console.error('Failed to parse string data:', e);
        return {
          data: [],
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: 15,
          next_page_url: null,
          prev_page_url: null,
          first_page_url: null,
          last_page_url: null,
          path: null,
          from: null,
          to: null,
        };
      }
    }

    if (dataObj && typeof dataObj === 'object' && dataObj.current_page !== undefined) {
      if (!Array.isArray(dataObj.data)) {
        dataObj.data = [];
      }
      return dataObj;
    }

    if (dataObj && dataObj.data && dataObj.data.current_page !== undefined) {
      if (!Array.isArray(dataObj.data.data)) {
        dataObj.data.data = [];
      }
      return dataObj.data;
    }

    if (dataObj && dataObj.data && Array.isArray(dataObj.data)) {
      return {
        data: dataObj.data,
        current_page: dataObj.current_page || 1,
        last_page: dataObj.last_page || 1,
        total: dataObj.total || dataObj.data.length,
        per_page: dataObj.per_page || 15,
        next_page_url: dataObj.next_page_url || null,
        prev_page_url: dataObj.prev_page_url || null,
        first_page_url: dataObj.first_page_url || null,
        last_page_url: dataObj.last_page_url || null,
        path: dataObj.path || null,
        from: dataObj.from || null,
        to: dataObj.to || null,
      };
    }

    if (Array.isArray(dataObj)) {
      return {
        data: dataObj,
        current_page: 1,
        last_page: 1,
        total: dataObj.length,
        per_page: dataObj.length,
        next_page_url: null,
        prev_page_url: null,
        first_page_url: null,
        last_page_url: null,
        path: null,
        from: null,
        to: null,
      };
    }

    if (dataObj && dataObj.data && typeof dataObj.data === 'object') {
      const nestedData = dataObj.data;
      if (nestedData.data && Array.isArray(nestedData.data)) {
        return {
          data: nestedData.data,
          current_page: nestedData.current_page || 1,
          last_page: nestedData.last_page || 1,
          total: nestedData.total || nestedData.data.length,
          per_page: nestedData.per_page || 15,
          next_page_url: nestedData.next_page_url || null,
          prev_page_url: nestedData.prev_page_url || null,
          first_page_url: nestedData.first_page_url || null,
          last_page_url: nestedData.last_page_url || null,
          path: nestedData.path || null,
          from: nestedData.from || null,
          to: nestedData.to || null,
        };
      }
    }

    return {
      data: [],
      current_page: 1,
      last_page: 1,
      total: 0,
      per_page: 15,
      next_page_url: null,
      prev_page_url: null,
      first_page_url: null,
      last_page_url: null,
      path: null,
      from: null,
      to: null,
    };
  } catch (error) {
    console.error("Error getting paginated data:", error);
    return {
      data: [],
      current_page: 1,
      last_page: 1,
      total: 0,
      per_page: 15,
      next_page_url: null,
      prev_page_url: null,
      first_page_url: null,
      last_page_url: null,
      path: null,
      from: null,
      to: null,
    };
  }
};

// ✅ FIXED: getEntityData - handles already unwrapped data
export const getEntityData = (response) => {
  try {
    if (!response) return null;

    let dataObj = response.data || response;

    if (typeof dataObj === 'string') {
      try {
        dataObj = JSON.parse(dataObj);
      } catch (e) {
        console.error('Failed to parse string data:', e);
        return null;
      }
    }

    if (dataObj && typeof dataObj === 'object') {
      if (dataObj.id !== undefined) {
        return dataObj;
      }

      if (dataObj.data && dataObj.data.id !== undefined) {
        return dataObj.data;
      }

      if (dataObj.data && typeof dataObj.data === 'object') {
        return dataObj.data;
      }

      if (dataObj.data && Array.isArray(dataObj.data) && dataObj.data.length === 1) {
        return dataObj.data[0];
      }

      if (dataObj.data && Array.isArray(dataObj.data) && dataObj.data.length > 1) {
        return dataObj.data;
      }

      return dataObj;
    }

    if (Array.isArray(dataObj) && dataObj.length === 1) {
      return dataObj[0];
    }

    if (Array.isArray(dataObj)) {
      return dataObj;
    }

    return dataObj;
  } catch (error) {
    console.error("Error getting entity data:", error);
    return null;
  }
};

// ✅ Debug function to test API response
export const debugApiResponse = async (url) => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    console.log("🔍 Debugging API response for:", url);
    console.log("🔑 Token present:", !!token);

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    const text = await response.text();
    console.log("📄 Raw response length:", text.length);
    console.log("📄 Raw response first 200 chars:", text.substring(0, 200));
    console.log(
      "📄 Raw response last 200 chars:",
      text.substring(Math.max(0, text.length - 200)),
    );

    const trimmed = text.trim();
    const lastChar = trimmed.charAt(trimmed.length - 1);
    const isComplete = lastChar === "}" || lastChar === "]";
    console.log("📄 Response complete:", isComplete);

    if (!isComplete) {
      console.warn("⚠️ Response appears to be truncated!");
      console.warn("📄 Last char:", lastChar);
    }

    try {
      const json = JSON.parse(trimmed);
      console.log("✅ JSON parsed successfully");
      console.log("📄 JSON keys:", Object.keys(json));
      return { success: true, data: json, isComplete };
    } catch (e) {
      console.error("❌ JSON parse error:", e.message);
      console.error(
        "📄 Problem area:",
        trimmed.substring(
          Math.max(0, e.position - 100 || 0),
          e.position + 100 || trimmed.length,
        ),
      );
      return { success: false, error: e.message, raw: text, isComplete };
    }
  } catch (error) {
    console.error("❌ Debug request failed:", error);
    return { success: false, error: error.message };
  }
};

export default apiClient;