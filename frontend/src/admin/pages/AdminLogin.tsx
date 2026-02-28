import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Heading,
  Input,
  Button,
  IconButton,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useToast,
  Alert,
  AlertIcon,
  Image,
} from "@chakra-ui/react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle,
  ArrowRight,
  Shield,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../utils/supabaseClient";
import { trpc } from "../../utils/trpc";
import logo from "../../assets/logo.jpg";

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionVStack = motion(VStack);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

// --- Sub-component: OTP Input ---
interface OtpInputProps {
  otp: string[];
  setOtp: (otp: string[]) => void;
  onComplete: () => void;
  isLoading: boolean;
}

function OtpInput({ otp, setOtp, onComplete, isLoading }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (v: string, i: number) => {
    if (!/^\d*$/.test(v)) return;
    const newOtp = [...otp];
    newOtp[i] = v.slice(-1);
    setOtp(newOtp);

    if (v && i < 7) {
      inputs.current[i + 1]?.focus();
    }
    if (newOtp.every((digit) => digit !== "") && newOtp.length === 8) {
      setTimeout(onComplete, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  return (
    <HStack spacing={{ base: 1, sm: 2 }} justify="center">
      {otp.map((digit, i) => (
        <MotionBox
          key={i}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30, 
            delay: i * 0.05 
          }}
        >
          <Input
            ref={(el) => { inputs.current[i] = el; }}
            id={`otp-${i}`}
            w={{ base: "26px", xs: "30px", sm: "36px", md: "48px" }}
            h={{ base: "38px", xs: "42px", sm: "48px", md: "60px" }}
            flexShrink={0}
            minW="0"
            p={0}
            textAlign="center"
            fontSize={{ base: "lg", sm: "xl", md: "2xl" }}
            fontWeight="800"
            fontFamily="monospace"
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            bg={digit ? "rgba(206, 0, 55, 0.05)" : "rgba(255, 255, 255, 0.03)"}
            border="2px solid"
            borderColor={digit ? "#CE0037" : "whiteAlpha.200"}
            borderRadius="14px"
            _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 1px #CE0037" }}
            color={digit ? "#CE0037" : "white"}
            isDisabled={isLoading}
            transition="all 0.2s"
          />
        </MotionBox>
      ))}
    </HStack>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<"login" | "2fa" | "forgot">("login");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const syncAdmin = trpc.admin.syncProfile.useMutation();
  const { data: authPolicy } = trpc.public.getAuthPolicy.useQuery();
  const recordFailure = trpc.public.recordLoginFailure.useMutation();
  const utils = trpc.useUtils();

  const MAX_ATTEMPTS = authPolicy?.maxLoginAttempts || 5;

  useEffect(() => {
    setError("");
  }, [authMode, step]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate("/admin"), 1500);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setError("Account locked. Contact your system administrator.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const lockStatus = await utils.public.checkLockout.fetch({ email });
      if (lockStatus?.locked) {
        setError("Account locked. Please contact system administrator.");
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

      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      setStep("2fa");
      toast({
        title: "Security Code Sent",
        description: "A secure verification code has been sent to your email.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      await recordFailure.mutateAsync({ email });
      setAttempts((prev) => prev + 1);
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain at least one number."); return; }
    
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setStep("2fa");
      toast({
        title: "Registration Successful",
        description: "A verification code has been sent to your email.",
        status: "success",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 8) {
      setError("Please enter the complete 8-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Verify OTP with Supabase
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: authMode === "register" ? "signup" : "email",
      });

      if (otpError) {
        throw new Error(otpError.message || "Invalid or expired verification code.");
      }

      // 2. Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Verification successful, but failed to retrieve user data.");
      }

      // 3. Sync profile with Backend
      try {
        await syncAdmin.mutateAsync({
          id: user.id,
          email: user.email!,
        });
      } catch (syncErr: any) {
        console.error("Profile sync error:", syncErr);
        // Specific message for the JWT secret mismatch we've been debugging
        if (syncErr.message?.includes("token signature") || syncErr.data?.httpStatus === 401) {
          throw new Error("Authentication successful, but server configuration is incorrect (JWT Secret mismatch). Please contact your administrator.");
        }
        throw new Error("Verification successful, but failed to sync your profile with the backend server.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during verification.");
      // Root cause for OTP failure is usually the code itself, so reset it
      if (!err.message?.includes("server configuration") && !err.message?.includes("sync")) {
        setOtp(["", "", "", "", "", "", "", ""]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      toast({
        title: "Reset Link Sent",
        description: "A password reset link has been sent to your email.",
        status: "success",
      });

      setStep("login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <MotionFlex
        minH="100vh"
        align="center"
        justify="center"
        bg="#0f172a"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <MotionVStack
          spacing={6}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <MotionBox
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
            w="80px"
            h="80px"
            borderRadius="50%"
            bg="#CE0037"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 10px 25px -5px rgba(206, 0, 55, 0.4)"
          >
            <CheckCircle size={40} color="white" />
          </MotionBox>
          <MotionHeading color="white" size="lg" fontWeight="800">Access Granted</MotionHeading>
          <MotionText color="gray.400" fontSize="md">Redirecting to Admin Dashboard...</MotionText>
        </MotionVStack>
      </MotionFlex>
    );
  }

  return (
    <Flex minH="100vh" bg="#0f172a" overflow="hidden" position="relative" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Background Decorative Elements */}
      <Box position="absolute" inset={0} pointerEvents="none" zIndex={0}>
        <Box
          position="absolute"
          top="-10%"
          right="-5%"
          w="50%"
          h="50%"
          bgGradient="radial(#CE003715, transparent)"
          filter="blur(100px)"
        />
        <Box
          position="absolute"
          bottom="-10%"
          left="-5%"
          w="40%"
          h="40%"
          bgGradient="radial(#CE003708, transparent)"
          filter="blur(80px)"
        />
        {/* Decorative Grid of Dots */}
        <Box position="absolute" inset={0} opacity={0.1}>
          {Array.from({ length: 120 }).map((_, i) => (
            <Box
              key={i}
              position="absolute"
              left={`${(i % 15) * 6.6 + 1}%`}
              top={`${Math.floor(i / 15) * 12 + 2}%`}
              w="2px"
              h="2px"
              borderRadius="50%"
              bg="white"
            />
          ))}
        </Box>
      </Box>

      {/* LEFT PANEL */}
      <MotionFlex
        w={{ base: "0%", lg: "44%" }}
        display={{ base: "none", lg: "flex" }}
        direction="column"
        justify="space-between"
        p={16}
        bgGradient="linear(to-br, #CE0037, #800022)"
        color="white"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        position="relative"
        zIndex={1}
      >
        {/* Decorative elements inside panel */}
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none" opacity={0.5}>
          <Box position="absolute" top="-100px" right="-100px" w="400px" h="400px" borderRadius="50%" border="1px solid rgba(255,255,255,0.1)" />
          <Box position="absolute" bottom="-80px" left="-80px" w="300px" h="300px" borderRadius="50%" border="1px solid rgba(255,255,255,0.05)" />
        </Box>

        <VStack align="start" spacing={14} position="relative">
          <HStack spacing={4}>
            <MotionBox
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              bg="white"
              p={3}
              borderRadius="16px"
              boxShadow="0 10px 20px -5px rgba(0, 0, 0, 0.2)"
              border="1px solid whiteAlpha.300"
            >
              <Image src={logo} h="60px" w="auto" alt="Clin Solutions L.L.C. Logo" objectFit="contain" />
            </MotionBox>
            <VStack align="start" spacing={0}>
              <Text fontWeight="800" letterSpacing="-0.5px" fontSize="xl" lineHeight="1">CLIN SOLUTIONS L.L.C.</Text>
              <Text fontSize="10px" color="whiteAlpha.700" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase">Pharmaceutical</Text>
            </VStack>
          </HStack>

          <VStack align="start" spacing={6}>
            <MotionHeading size="2xl" lineHeight="1.1" letterSpacing="-1px">
              Drug Safety <br />
              Reporting Portal
            </MotionHeading>
            <MotionText fontSize="lg" color="whiteAlpha.800" maxW="380px" lineHeight="1.6">
              Restricted to authorized Clin Solutions L.L.C. administrators only. Manage reports and protect patient safety globally.
            </MotionText>
          </VStack>
        </VStack>

        <VStack align="start" spacing={4} position="relative">
          {[
            { icon: Shield, label: "Admin-only access enforced" },
            { icon: Lock, label: "Encrypted & audit-logged session" },
            { icon: Activity, label: "Pharmacovigilance compliant" },
          ].map(({ icon: Icon, label }, i) => (
            <MotionHStack key={label} spacing={3} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 200, damping: 25 }}>
              <Box w="32px" h="32px" borderRadius="10px" bg="whiteAlpha.100" display="flex" alignItems="center" justifyContent="center">
                <Icon size={14} color="rgba(255,255,255,0.9)" />
              </Box>
              <Text fontSize="13px" color="whiteAlpha.800" fontWeight="500">{label}</Text>
            </MotionHStack>
          ))}
        </VStack>
      </MotionFlex>

      {/* RIGHT PANEL */}
      <Flex flex="1" align="center" justify="center" p={{ base: 4, md: 8 }} zIndex={1}>
        <MotionBox
          w="100%"
          maxW="420px"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <VStack 
            spacing={{ base: 6, md: 8 }} 
            align="stretch" 
            bg="rgba(15, 23, 42, 0.4)" 
            p={{ base: 5, sm: 8, md: 10 }} 
            borderRadius="32px" 
            border="1px solid" 
            borderColor="whiteAlpha.100" 
            backdropFilter="blur(24px)" 
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          >
            {/* Branding for mobile/tablet where left panel is hidden */}
            <VStack spacing={3} align="center" mb={4} display={{ base: "flex", lg: "none" }}>
              <Box bg="white" p={2.5} borderRadius="14px" border="1px solid whiteAlpha.200" boxShadow="sm">
                <Image src={logo} h="40px" w="auto" alt="Clin Solutions L.L.C. Logo" objectFit="contain" />
              </Box>
              <VStack spacing={0}>
                <Text fontWeight="800" color="white" fontSize="lg" lineHeight="1">CLIN SOLUTIONS L.L.C.</Text>
                <Text fontSize="9px" color="whiteAlpha.600" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase">Pharmaceutical</Text>
              </VStack>
            </VStack>

            <AnimatePresence exitBeforeEnter>

              {step === "login" && (
                <MotionVStack
                  key="login"
                  spacing={7}
                  align="stretch"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <VStack align="start" spacing={2}>
                    <MotionHeading size="lg" color="white" fontWeight="800" letterSpacing="-0.5px">
                      {authMode === "login" ? "Admin Sign In" : "Register Account"}
                    </MotionHeading>
                    <Text color="#64748b" fontSize="sm">
                      {authMode === "login" ? "Authorized Clin Solutions L.L.C. administrators only" : "Create your secure administrator credentials"}
                    </Text>
                  </VStack>

                  {error && (
                    <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <Alert status="error" borderRadius="16px" bg="#1e0a0a" color="#f87171" border="1px solid" borderColor="#7f1d1d" py={3}>
                        <AlertIcon color="#ef4444" />
                        <Text fontSize="sm" fontWeight="500">{error}</Text>
                      </Alert>
                    </MotionBox>
                  )}

                  <VStack spacing={5} align="stretch" as="form" onSubmit={(e) => { e.preventDefault(); authMode === "login" ? handleLogin() : handleRegister(); }}>
                    <FormControl>
                      <FormLabel color="#64748b" fontSize="11px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>EMAIL ADDRESS</FormLabel>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Mail size={16} color="#475569" />
                        </InputLeftElement>
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          bg="#1e293b"
                          border="1px solid"
                          borderColor="whiteAlpha.200"
                          _hover={{ borderColor: "whiteAlpha.400" }}
                          _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 1px #CE0037" }}
                          color="white"
                          fontSize="14px"
                          borderRadius="14px"
                          placeholder="yourname@clinsol.com"
                          _placeholder={{ color: "whiteAlpha.200" }}
                        />
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel color="#64748b" fontSize="11px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>PASSWORD</FormLabel>
                      <InputGroup size="lg" transition="all 0.2s">
                        <InputLeftElement pointerEvents="none">
                          <Lock size={16} color="#475569" />
                        </InputLeftElement>
                        <Input
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          bg="#1e293b"
                          border="1px solid"
                          borderColor="whiteAlpha.200"
                          _hover={{ borderColor: "whiteAlpha.400" }}
                          _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 1px #CE0037" }}
                          color="white"
                          fontSize="14px"
                          borderRadius="14px"
                          placeholder="••••••••"
                          _placeholder={{ color: "whiteAlpha.200" }}
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label="toggle password"
                            size="sm"
                            variant="ghost"
                            color="whiteAlpha.400"
                            _hover={{ color: "white", bg: "transparent" }}
                            icon={showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            onClick={() => setShowPass(!showPass)}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <HStack justify="end">
                      <Text
                        fontSize="xs"
                        color="#CE0037"
                        cursor="pointer"
                        fontWeight="700"
                        _hover={{ color: "#ef4444" }}
                        onClick={() => setStep("forgot")}
                      >
                        Forgot password?
                      </Text>
                    </HStack>

                    <Button
                      size="lg"
                      type="submit"
                      h="56px"
                      bg="#CE0037"
                      color="white"
                      borderRadius="16px"
                      _hover={{ bg: "#a1002b", transform: "translateY(-1px)", boxShadow: "0 10px 20px -5px rgba(206, 0, 55, 0.4)" }}
                      _active={{ bg: "#73001e", transform: "translateY(0)" }}
                      isLoading={loading}
                      rightIcon={<ArrowRight size={18} />}
                      fontWeight="700"
                      fontSize="15px"
                      transition="all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                    >
                      {authMode === "login" ? "Sign In to Admin Panel" : "Create Admin Account"}
                    </Button>
                  </VStack>

                  <Text fontSize="13px" color="#64748b" textAlign="center" fontWeight="500">
                    {authMode === "login"
                      ? "Need an administrator account?"
                      : "Already have an account?"}{" "}
                    <Text
                      as="span"
                      color="#CE0037"
                      cursor="pointer"
                      fontWeight="800"
                      _hover={{ textDecoration: "underline" }}
                      onClick={() =>
                        setAuthMode(authMode === "login" ? "register" : "login")
                      }
                    >
                      {authMode === "login" ? "Register here" : "Sign In"}
                    </Text>
                  </Text>
                </MotionVStack>
              )}

              {step === "2fa" && (
                <MotionVStack
                  key="2fa"
                  spacing={10}
                  align="stretch"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <VStack align="start" spacing={4}>
                    <MotionBox 
                      bg="white" 
                      p={2.5} 
                      borderRadius="14px" 
                      border="1px solid whiteAlpha.200"
                      boxShadow="sm"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Image src={logo} h={6} w="auto" alt="Clin Solutions L.L.C. Logo" />
                    </MotionBox>
                    <VStack align="start" spacing={1}>
                      <Heading size="lg" color="white" fontWeight="800" letterSpacing="-0.5px">Verify Identity</Heading>
                      <Text color="#64748b" fontSize="sm" lineHeight="1.6">
                        Enter the 8-digit code sent to<br />
                        <Text as="span" color="whiteAlpha.800" fontWeight="700">{email}</Text>
                      </Text>
                    </VStack>
                  </VStack>

                  {error && (
                    <Alert status="error" borderRadius="16px" bg="#1e0a0a" color="#f87171" border="1px solid" borderColor="#7f1d1d">
                      <AlertIcon color="#ef4444" />
                      <Text fontSize="sm" fontWeight="500">{error}</Text>
                    </Alert>
                  )}

                  <OtpInput
                    otp={otp}
                    setOtp={setOtp}
                    onComplete={handleVerify}
                    isLoading={loading}
                  />

                  <VStack spacing={5}>
                    <Button
                      w="100%"
                      size="lg"
                      h="56px"
                      bg="#CE0037"
                      color="white"
                      borderRadius="16px"
                      _hover={{ bg: "#a1002b", boxShadow: "0 10px 20px -5px rgba(206, 0, 55, 0.4)" }}
                      onClick={handleVerify}
                      isLoading={loading}
                      fontWeight="700"
                    >
                      Verify & Login
                    </Button>
                    <VStack spacing={3}>
                      <Text fontSize="xs" color="#64748b" fontWeight="600">
                        Didn't receive a code?{" "}
                        <Text as="span" color="#CE0037" cursor="pointer" onClick={() => {}} fontWeight="800">Resend</Text>
                      </Text>
                      <Button
                        variant="ghost"
                        size="sm"
                        color="#64748b"
                        _hover={{ color: "white", bg: "whiteAlpha.100" }}
                        onClick={() => setStep("login")}
                        isDisabled={loading}
                        fontSize="12px"
                        leftIcon={<ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />}
                      >
                        Back to sign in
                      </Button>
                    </VStack>
                  </VStack>
                </MotionVStack>
              )}

              {step === "forgot" && (
                <MotionVStack
                  key="forgot"
                  spacing={8}
                  align="stretch"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <VStack align="start" spacing={4}>
                    <Box bg="rgba(206, 0, 55, 0.1)" p={3} borderRadius="16px">
                      <Mail size={28} color="#CE0037" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Heading size="lg" color="white" fontWeight="800" letterSpacing="-0.5px">Forgot Password?</Heading>
                      <Text color="#64748b" fontSize="sm">
                        Enter your email to receive a recovery link.
                      </Text>
                    </VStack>
                  </VStack>

                  {error && (
                    <Alert status="error" borderRadius="16px" bg="#1e0a0a" color="#f87171" border="1px solid" borderColor="#7f1d1d">
                      <AlertIcon color="#ef4444" />
                      <Text fontSize="sm" fontWeight="500">{error}</Text>
                    </Alert>
                  )}

                  <FormControl>
                    <FormLabel color="#64748b" fontSize="11px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>EMAIL ADDRESS</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Mail size={16} color="#475569" />
                      </InputLeftElement>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        bg="#1e293b"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 1px #CE0037" }}
                        color="white"
                        borderRadius="14px"
                        fontSize="14px"
                        placeholder="yourname@clinsol.com"
                      />
                    </InputGroup>
                  </FormControl>

                  <Button
                    size="lg"
                    h="56px"
                    bg="#CE0037"
                    color="white"
                    borderRadius="16px"
                    _hover={{ bg: "#a1002b", boxShadow: "0 10px 20px -5px rgba(206, 0, 55, 0.4)" }}
                    onClick={handleForgotPassword}
                    isLoading={loading}
                    fontWeight="700"
                  >
                    Send Reset Link
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    color="#64748b"
                    _hover={{ color: "white", bg: "whiteAlpha.100" }}
                    onClick={() => setStep("login")}
                    isDisabled={loading}
                    fontSize="12px"
                    leftIcon={<ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />}
                  >
                    Back to sign in
                  </Button>
                </MotionVStack>
              )}
            </AnimatePresence>
          </VStack>
        </MotionBox>
      </Flex>
    </Flex>
  );
}

// Utility component for staggered list items
const MotionHStack = motion(HStack);
