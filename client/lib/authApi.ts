/**
 * Authentication API Service
 * Handles forgot password and password reset operations
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export interface ForgotPasswordResponse {
  status: string;
  message: string;
  data: {
    email: string;
    expires_in: number;
  };
}

export interface VerifyOTPResponse {
  status: string;
  message: string;
  data: {
    email: string;
    valid: boolean;
  };
}

export interface ResetPasswordResponse {
  status: string;
  message: string;
  data: {
    email: string;
  };
}

export interface APIError {
  detail: string;
}

/**
 * Request password reset OTP
 * Sends a 6-digit OTP to the user's email
 */
export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as APIError).detail || "Failed to send OTP");
  }

  return data as ForgotPasswordResponse;
}

/**
 * Verify OTP without resetting password
 * Optional step for better UX
 */
export async function verifyOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as APIError).detail || "Invalid OTP");
  }

  return data as VerifyOTPResponse;
}

/**
 * Reset password with OTP
 * Final step in the password reset flow
 */
export async function resetPasswordWithOTP(
  email: string,
  otp: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      otp,
      new_password: newPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as APIError).detail || "Failed to reset password");
  }

  return data as ResetPasswordResponse;
}
