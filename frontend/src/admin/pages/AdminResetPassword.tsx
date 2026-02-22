import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";
import takedaLogo from "../../assets/takeda-logo.png";

export default function AdminResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Check if we have a session or recovery token in the URL
    // Supabase handles the recovery flow by putting the user in a temporary session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, the link might be invalid or expired
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/admin/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError("Please enter a new password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      toast({
        title: "Password Updated",
        description: "Your password has been reset successfully. Redirecting...",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <motion.div {...({} as any)} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300 }} style={{ textAlign: "center" }}>
          <motion.div {...({} as any)} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
            style={{ width: 80, height: 80, borderRadius: "50%", background: "#CE0037", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle size={40} color="#fff" />
          </motion.div>
          <motion.h2 {...({} as any)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Password Reset Successful</motion.h2>
          <motion.p {...({} as any)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ color: "#64748b", fontSize: 14 }}>Redirecting to Sign In...</motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', system-ui, sans-serif", background: "#0f172a" }}>
      
      {/* ── LEFT — Takeda Brand Panel ── */}
      <motion.div {...({} as any)} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        style={{
          width: "44%", display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "48px 52px", position: "relative", overflow: "hidden",
          background: "linear-gradient(155deg, #CE0037 0%, #9b0028 55%, #5c0018 100%)"
        }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 380, height: 380, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        </div>

        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 32, background: "rgba(255,255,255,0.1)", padding: "12px 20px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <img src={takedaLogo} alt="Takeda Logo" style={{ height: 32, width: "auto" }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>TAKEDA</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pharmaceutical</p>
            </div>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-1px" }}>
            Secure Your Account
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 auto", lineHeight: 1.8, maxWidth: 320 }}>
            Enter a strong new password to regain access to the Takeda Drug Safety Reporting Portal.
          </p>
        </div>
      </motion.div>

      {/* ── RIGHT — Form Panel ── */}
      <motion.div {...({} as any)} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 64px" }}>
        
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.5px" }}>Set New Password</h2>
            <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>Create a secure password for your administrator account.</p>
          </div>

          <form onSubmit={handleUpdatePassword}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} color="#475569" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••••"
                  style={{ width: "100%", paddingLeft: 38, paddingRight: 44, paddingTop: 11, paddingBottom: 11, background: "#1e293b", border: `1px solid ${error && !password ? "#ef4444" : "#334155"}`, borderRadius: 10, fontSize: 14, color: "#f1f5f9", outline: "none", boxSizing: "border-box" }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 4 }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} color="#475569" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPass ? "text" : "password"} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder="••••••••••"
                  style={{ width: "100%", paddingLeft: 38, paddingRight: 12, paddingTop: 11, paddingBottom: 11, background: "#1e293b", border: `1px solid ${error && password !== confirmPassword ? "#ef4444" : "#334155"}`, borderRadius: 10, fontSize: 14, color: "#f1f5f9", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div {...({} as any)} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "#1e0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 12px", marginBottom: 20 }}>
                  <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" {...({} as any)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "#CE0037", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
              {loading
                ? <motion.div {...({} as any)} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                : <><Shield size={16} /> Reset Password <ArrowRight size={14} /></>}
            </motion.button>
          </form>

          <button onClick={() => navigate('/admin/login')}
            style={{ display: "block", margin: "24px auto 0", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#475569", fontWeight: 500 }}>
            ← Back to login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
