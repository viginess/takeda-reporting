import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, ArrowRight, Activity } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";
import { trpc } from "../../utils/trpc";
import takedaLogo from "../../assets/takeda-logo.png";



export default function AdminLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [step, setStep]         = useState<"login" | "2fa" | "forgot">("login");
  const [otp, setOtp]           = useState(["", "", "", "", "", "", "", ""]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [authMode, setAuthMode]   = useState<"login" | "register">("login");
  const navigate = useNavigate();
  const toast = useToast();
  const syncAdmin = trpc.admin.syncProfile.useMutation();
  const { data: authPolicy } = trpc.public.getAuthPolicy.useQuery();
  const recordFailure = trpc.public.recordLoginFailure.useMutation();
  const utils = trpc.useUtils();

  const MAX_ATTEMPTS = authPolicy?.maxLoginAttempts || 5;

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/admin');
      }, 1500); // Wait 1.5s to show the success animation before navigating
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);


  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    if (attempts >= MAX_ATTEMPTS) { setError("Account locked. Contact your system administrator."); return; }
    setLoading(true);
    setError("");

    try {
      // 1. Check if account is locked on our backend first
      const lockStatus = await utils.public.checkLockout.fetch({ email });
      if (lockStatus?.locked) {
        setError(("message" in lockStatus ? lockStatus.message : null) || "Account locked. Contact your system administrator.");
        setLoading(false);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      
      const isMfaRequired = authPolicy?.isMfaRequired !== false;

      if (!isMfaRequired) {
        // Skip MFA if disabled globally
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await syncAdmin.mutateAsync({
            id: user.id,
            email: user.email!,
          });
        }
        setSuccess(true);
        return;
      }

      // Even if confirmed, we always trigger an OTP for mandatory 2FA as requested
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (otpError) throw otpError;

      setStep("2fa");
      toast({
        title: "OTP Sent",
        description: "A secure verification code has been sent to your email.",
        status: "info",
      });
    } catch (err: any) {
      console.error("Auth error:", err);
      
      // 2. Record failure on our backend to track lockouts
      await recordFailure.mutateAsync({ email });
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const remaining = MAX_ATTEMPTS - newAttempts;
      setError(err.message || (remaining > 0
        ? `Invalid credentials. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`
        : "Account locked. Contact your system administrator."));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    
    // Password Validation
    if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain at least one number."); return; }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) { setError("Password must contain at least one special character."); return; }
    
    setLoading(true);
    setError("");
    
    try {
      const { error: regError } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (regError) throw regError;

      toast({
        title: "Registration Successful",
        description: "A verification code has been sent to your email.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setStep("2fa");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 7) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 8) { setError("Please enter the complete 8-digit code."); return; }
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: authMode === 'register' ? 'signup' : 'email'
      });

      if (verifyError) throw verifyError;

      // Programmatic Sync: Ensure admin record exists in public schema
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await syncAdmin.mutateAsync({
          id: user.id,
          email: user.email!,
        });
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
      setOtp(["", "", "", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      let resendError;
      if (authMode === 'register') {
        const { error } = await supabase.auth.resend({ type: 'signup', email });
        resendError = error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        resendError = error;
      }
      
      if (resendError) throw resendError;
      toast({
        title: "New Code Sent",
        description: "A new verification code has been sent to your email.",
        status: "info",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to resend code.",
        status: "error",
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Please enter your email address first."); return; }
    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (resetError) throw resetError;

      toast({
        title: "Reset Email Sent",
        description: "A password reset link has been sent to your email.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setStep("login");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <motion.div {...({} as any)} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300 }} style={{ textAlign: "center" }}>
          <motion.div {...({} as any)} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
            style={{ width: 80, height: 80, borderRadius: "50%", background: "#CE0037", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle size={40} color="#fff" />
          </motion.div>
          <motion.h2 {...({} as any)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Access Granted</motion.h2>
          <motion.p {...({} as any)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ color: "#64748b", fontSize: 14 }}>Redirecting to Admin Dashboard...</motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', system-ui, sans-serif", background: "#0f172a" }}>

      {/* ── LEFT — Takeda Brand Panel ── */}
      <motion.div {...({} as any)} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        style={{
          width: "44%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "48px 52px", position: "relative", overflow: "hidden",
          background: "linear-gradient(155deg, #CE0037 0%, #9b0028 55%, #5c0018 100%)"
        }}>

        {/* Background decoration */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 380, height: 380, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ position: "absolute", top: "35%", right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${(i % 10) * 11 + 3}%`, top: `${Math.floor(i / 10) * 12 + 4}%`, width: 2, height: 2, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
          ))}
        </div>

        {/* Takeda Logo */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 52 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
              <img src={takedaLogo} alt="Takeda Logo" style={{ height: 32, width: "auto" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>TAKEDA</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pharmaceutical</p>
            </div>
          </div>

          <h1 style={{ fontSize: 34, fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-1px" }}>
            Drug Safety<br />Reporting Portal
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.8, maxWidth: 300 }}>
            Restricted to authorized Takeda administrators only. Manage reports, review urgent cases, and protect patient safety.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          {[
            { icon: Shield,   label: "Admin-only access enforced" },
            { icon: Lock,     label: "Encrypted & audit-logged session" },
            { icon: Activity, label: "Pharmacovigilance compliant" },
          ].map(({ icon: Icon, label }, i) => (
            <motion.div {...({} as any)} key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={12} color="rgba(255,255,255,0.85)" />
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── RIGHT — Form Panel ── */}
      <motion.div {...({} as any)} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 64px" }}>

        <div style={{ width: "100%", maxWidth: 400 }}>
          <AnimatePresence {...({} as any)}>

            {/* ── Step 1: Login ── */}
            {step === "login" && (
              <motion.div {...({} as any)} key="login" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>

                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
                    {authMode === "login" ? "Admin Sign In" : "Admin Registration"}
                  </h2>
                  <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
                    {authMode === "login" 
                      ? "Authorized Takeda administrators only" 
                      : "Create your secure administrator account"}
                  </p>
                </div>

                {/* Account locked banner */}
                <AnimatePresence>
                  {attempts >= MAX_ATTEMPTS && (
                    <motion.div {...({} as any)} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ display: "flex", gap: 10, background: "#1e0a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                      <Lock size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Account Locked</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#f87171" }}>Too many failed attempts. Contact your Takeda system administrator.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Form Wrapper */}
                <form onSubmit={(e) => { e.preventDefault(); authMode === "login" ? handleLogin() : handleRegister(); }}>
                  {/* Email */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={14} color="#475569" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                      <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="yourname@takeda.com"
                        style={{ width: "100%", paddingLeft: 38, paddingRight: 12, paddingTop: 11, paddingBottom: 11, background: "#1e293b", border: `1px solid ${error && !email ? "#ef4444" : "#334155"}`, borderRadius: 10, fontSize: 14, color: "#f1f5f9", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</label>
                    <div style={{ position: "relative" }}>
                      <Lock size={14} color="#475569" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                      <input type={showPass ? "text" : "password"} value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        placeholder="••••••••••"
                        style={{ width: "100%", paddingLeft: 38, paddingRight: 44, paddingTop: 11, paddingBottom: 11, background: "#1e293b", border: `1px solid ${error && !password ? "#ef4444" : "#334155"}`, borderRadius: 10, fontSize: 14, color: "#f1f5f9", outline: "none", boxSizing: "border-box" }} />
                      <button type="button" onClick={() => setShowPass((v: boolean) => !v)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 4 }}>
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", marginBottom: 20 }}>
                    <span onClick={() => { setStep("forgot"); setError(""); }} style={{ fontSize: 12, color: "#CE0037", fontWeight: 600, cursor: "pointer" }}>Forgot password?</span>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div {...({} as any)} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
                        <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Attempt dots */}
                  {attempts > 0 && attempts < MAX_ATTEMPTS && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                      <span style={{ fontSize: 11, color: "#475569" }}>Failed attempts:</span>
                      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < attempts ? "#ef4444" : "#1e293b", border: "1px solid #334155", transition: "background 0.2s" }} />
                      ))}
                    </div>
                  )}

                  {/* Submit */}
                  <motion.button type="submit" {...({} as any)} whileHover={attempts < MAX_ATTEMPTS ? { scale: 1.01 } : {}} whileTap={attempts < MAX_ATTEMPTS ? { scale: 0.98 } : {}}
                    disabled={loading || (authMode === "login" && attempts >= MAX_ATTEMPTS)}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 10, border: "none",
                      background: (authMode === "login" && attempts >= MAX_ATTEMPTS) ? "#1e293b" : "#CE0037",
                      color: (authMode === "login" && attempts >= MAX_ATTEMPTS) ? "#475569" : "#fff",
                      fontSize: 14, fontWeight: 700, cursor: (authMode === "login" && attempts >= MAX_ATTEMPTS) ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s"
                    }}>
                    {loading
                      ? <motion.div {...({} as any)} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                      : <>
                          <Shield size={15} /> 
                          {authMode === "login" ? "Sign In to Admin Panel" : "Create Admin Account"} 
                          <ArrowRight size={14} />
                        </>}
                  </motion.button>
                </form>

                <div style={{ marginTop: 24, textAlign: "center" }}>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                    {authMode === "login" ? "Need an administrator account?" : "Already have an account?"}{" "}
                    <button 
                      onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}
                      style={{ background: "none", border: "none", color: "#CE0037", fontWeight: 700, cursor: "pointer", padding: 0 }}
                    >
                      {authMode === "login" ? "Register here" : "Sign In"}
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: 2FA ── */}
            {step === "2fa" && (
              <motion.div {...({} as any)} key="2fa" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <Shield size={24} color="#CE0037" />
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.5px" }}>Verify Identity</h2>
                  <p style={{ color: "#64748b", margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                    Enter the 8-digit code sent to<br />
                    <strong style={{ color: "#94a3b8" }}>{email}</strong>
                  </p>
                </div>

                {/* OTP Boxes */}
                <div style={{ display: "flex", gap: 10, marginBottom: 28, justifyContent: "center" }}>
                  {otp.map((digit: string, i: number) => (
                    <input key={i} id={`otp-${i}`} value={digit}
                      onChange={(e) => handleOtp(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKey(e, i)}
                      maxLength={1} inputMode="numeric"
                      style={{ width: 52, height: 58, textAlign: "center", fontSize: 22, fontWeight: 800, background: digit ? "#1a0a0f" : "#1e293b", border: `2px solid ${digit ? "#CE0037" : "#334155"}`, borderRadius: 12, color: digit ? "#CE0037" : "#f1f5f9", outline: "none", transition: "all 0.15s", fontFamily: "monospace" }} />
                  ))}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div {...({} as any)} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
                      <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button {...({} as any)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleVerify} disabled={loading}
                  style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: otp.join("").length === 8 ? "#CE0037" : "#1e293b", color: otp.join("").length === 8 ? "#fff" : "#475569", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", marginBottom: 16 }}>
                  {loading
                    ? <motion.div {...({} as any)} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                    : <><CheckCircle size={15} /> Verify & Enter Dashboard</>}
                </motion.button>

                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Didn't receive a code? </span>
                  <button onClick={handleResendOtp} style={{ background: "none", border: "none", fontSize: 12, color: "#CE0037", fontWeight: 600, cursor: "pointer", padding: 0 }}>Resend</button>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                  <button onClick={() => { setStep("login"); setError(""); setOtp(["", "", "", "", "", "", "", ""]); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                    <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to login
                  </button>
                  {authMode === "register" && (
                    <button onClick={() => { setStep("login"); setAuthMode("register"); setError(""); setOtp(["", "", "", "", "", "", "", ""]); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#CE0037", fontWeight: 600 }}>
                      Change email
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Forgot Password ── */}
            {step === "forgot" && (
              <motion.div {...({} as any)} key="forgot" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <Mail size={24} color="#CE0037" />
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.5px" }}>Forgot Password?</h2>
                  <p style={{ color: "#64748b", margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                    No problem! Enter your email below and we'll send you a link to reset your password.
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={14} color="#475569" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="yourname@takeda.com"
                      style={{ width: "100%", paddingLeft: 38, paddingRight: 12, paddingTop: 11, paddingBottom: 11, background: "#1e293b", border: `1px solid ${error ? "#ef4444" : "#334155"}`, borderRadius: 10, fontSize: 14, color: "#f1f5f9", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div {...({} as any)} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
                      <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button {...({} as any)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleForgotPassword} disabled={loading}
                  style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "#CE0037", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", marginBottom: 16 }}>
                  {loading
                    ? <motion.div {...({} as any)} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                    : <><Mail size={15} /> Send Reset Link</>}
                </motion.button>

                <button onClick={() => { setStep("login"); setError(""); }}
                  style={{ display: "block", margin: "0 auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#475569" }}>
                  ← Back to login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
