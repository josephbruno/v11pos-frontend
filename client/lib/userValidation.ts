export interface UserValidationInput {
  fullName?: string;
  username?: string;
  password?: string;
}

const COMMON_PASSWORDS = new Set([
  "123456",
  "12345678",
  "password",
  "password123",
  "admin123",
  "qwerty123",
]);

export function validateFullName(value: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "Full name is required.";
  if (normalizedValue.length < 2) return "Full name must be at least 2 characters.";
  if (normalizedValue.length > 100) return "Full name must be at most 100 characters.";
  if (!/^[A-Za-z][A-Za-z ]*$/.test(normalizedValue)) {
    return "Full name can contain only letters and single spaces.";
  }
  if (/\s{2,}/.test(normalizedValue)) {
    return "Full name cannot contain multiple consecutive spaces.";
  }
  return "";
}

export function validateUsername(value: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "Username is required.";
  if (normalizedValue.length < 3 || normalizedValue.length > 20) {
    return "Username must be 3-20 characters.";
  }
  if (!/^[A-Za-z]/.test(normalizedValue)) {
    return "Username must start with a letter.";
  }
  if (!/^[A-Za-z0-9._]+$/.test(normalizedValue)) {
    return "Username can use only letters, numbers, . and _.";
  }
  if (/[._]$/.test(normalizedValue)) {
    return "Username cannot end with . or _.";
  }
  if (/([._])\1/.test(normalizedValue)) {
    return "Username cannot contain consecutive special characters.";
  }
  return "";
}

export function validatePassword(value: string, username?: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "Temporary password is required.";
  if (normalizedValue.length < 8) return "Password must be at least 8 characters.";
  if (normalizedValue.length > 16) return "Password must be at most 16 characters.";
  if (/\s/.test(normalizedValue)) return "Password cannot contain spaces.";
  if (!/[A-Z]/.test(normalizedValue)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(normalizedValue)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/[0-9]/.test(normalizedValue)) {
    return "Password must include at least one number.";
  }
  if (!/[@#$%&*!]/.test(normalizedValue)) {
    return "Password must include at least one special character (@ # $ % & * !).";
  }
  const usernameValue = (username || "").trim().toLowerCase();
  if (usernameValue && normalizedValue.toLowerCase().includes(usernameValue)) {
    return "Password cannot contain the username.";
  }
  if (COMMON_PASSWORDS.has(normalizedValue.toLowerCase())) {
    return "Please choose a stronger password.";
  }
  return "";
}

export function validateUserPayload(
  input: UserValidationInput,
  options?: { requirePassword?: boolean; validatePasswordIfProvided?: boolean },
): Record<"name" | "username" | "password", string> {
  const errors: Record<"name" | "username" | "password", string> = {
    name: "",
    username: "",
    password: "",
  };

  if (typeof input.fullName === "string") {
    errors.name = validateFullName(input.fullName);
  }
  if (typeof input.username === "string") {
    errors.username = validateUsername(input.username);
  }

  const passwordValue = typeof input.password === "string" ? input.password : "";
  if (options?.requirePassword) {
    errors.password = validatePassword(passwordValue, input.username);
  } else if (options?.validatePasswordIfProvided && passwordValue.trim()) {
    errors.password = validatePassword(passwordValue, input.username);
  }

  return errors;
}
