import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Lock, CheckCircle, Loader2, Moon, Sun, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: email, 2: otp+password, 3: success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiresIn, setExpiresIn] = useState(600);

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setExpiresIn(result.data?.expires_in || 600);
        // Note: Backend returns success even for non-existent emails (security feature)
        // Real validation happens when OTP is used
        setStep(2);
      } else {
        setError(result.detail || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Validate OTP format
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("OTP must be a 6-digit number");
      return;
    }

    setLoading(true);

    try {
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

      const result = await response.json();

      if (response.ok) {
        setStep(3);
      } else {
        // Provide helpful error message
        const errorMsg = result.detail || "Failed to reset password";
        if (errorMsg.toLowerCase().includes("invalid") || errorMsg.toLowerCase().includes("expired")) {
          setError("Invalid or expired OTP. Please check your email or request a new OTP. Note: OTP is only sent if the email exists in our system.");
        } else if (errorMsg.toLowerCase().includes("user not found")) {
          setError("Email address not found in our system. Please check the email address and try again.");
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Theme Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className="absolute top-4 right-4 border-gray-200 dark:border-gray-700"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back to Login */}
        <Button
          variant="ghost"
          className="mb-4 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => navigate("/login")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-pos-accent to-green-600 rounded-full flex items-center justify-center mb-4"
            >
              {step === 1 && <Mail className="h-8 w-8 text-white" />}
              {step === 2 && <Lock className="h-8 w-8 text-white" />}
              {step === 3 && <CheckCircle className="h-8 w-8 text-white" />}
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Reset Password"}
              {step === 3 && "Password Reset!"}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {step === 1 && "Enter your email to receive a password reset OTP"}
              {step === 2 && `OTP sent to ${email}`}
              {step === 3 && "Your password has been successfully reset"}
            </p>
          </CardHeader>

          <CardContent>
            {/* Step 1: Email Input */}
            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className={`h-11 transition-all duration-200 ${
                      error
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-pos-accent"
                    }`}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-pos-accent hover:bg-pos-accent/90 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>

                <div className="space-y-2 text-xs text-center text-gray-600 dark:text-gray-400 mt-4">
                  <p>
                    An OTP will be sent if your email is registered in our system.
                  </p>
                  <p className="text-gray-500 dark:text-gray-500">
                    OTP expires in 10 minutes • Check spam folder if not received
                  </p>
                </div>
              </form>
            )}

            {/* Step 2: OTP & New Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <div className="space-y-1">
                      <p className="font-medium">Check your email for the OTP code</p>
                      <p className="text-sm">If <strong>{email}</strong> exists in our system, you'll receive an OTP within a few minutes. Valid for {Math.floor(expiresIn / 60)} minutes.</p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">
                    6-Digit OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    disabled={loading}
                    className="h-11 text-center text-2xl tracking-widest font-mono border-gray-300 dark:border-gray-600 focus:border-pos-accent transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                      disabled={loading}
                      className="h-11 pr-10 border-gray-300 dark:border-gray-600 focus:border-pos-accent transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                      disabled={loading}
                      className="h-11 pr-10 border-gray-300 dark:border-gray-600 focus:border-pos-accent transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-pos-accent hover:bg-pos-accent/90 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
              </form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                </motion.div>

                <div className="space-y-2">
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Password Reset Successful!
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You can now login with your new password.
                  </p>
                </div>

                <Button
                  className="w-full h-11 bg-pos-accent hover:bg-pos-accent/90"
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400"
        >
          <p>🔒 Secure password reset process</p>
          <p>OTPs are valid for 10 minutes and can only be used once</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
