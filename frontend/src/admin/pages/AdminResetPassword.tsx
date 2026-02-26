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
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
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
function OtpInput({ onComplete, isLoading }: { onComplete: (code: string) => void; isLoading: boolean }) {
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (v: string, i: number) => {
    if (!/^\d*$/.test(v)) return;
    const digit = v.slice(-1);
    const newOtp = [...otp];
    newOtp[i] = digit;
    setOtp(newOtp);

    if (digit && i < 7) {
      inputs.current[i + 1]?.focus();
    }
    
    if (newOtp.every((d) => d !== "") && newOtp.length === 8) {
      onComplete(newOtp.join(""));
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
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20
          }}
        >
          <Input
            ref={(el) => { inputs.current[i] = el; }}
            id={`otp-${i}`}
            w={{ base: "28px", xs: "32px", sm: "40px", md: "52px" }}
            h={{ base: "40px", xs: "44px", sm: "52px", md: "64px" }}
            flexShrink={0}
            minW="0"
            p={0}
            textAlign="center"
            fontSize={{ base: "lg", sm: "xl", md: "3xl" }}
            fontWeight="700"
            fontFamily="'DM Sans', monospace"
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            bg={digit ? "rgba(206, 0, 55, 0.04)" : "rgba(255, 255, 255, 0.02)"}
            border="1px solid"
            borderColor={digit ? "#CE0037" : "whiteAlpha.100"}
            borderRadius="12px"
            _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 2px rgba(206, 0, 55, 0.2)" }}
            _hover={{ borderColor: digit ? "#CE0037" : "whiteAlpha.300" }}
            color={digit ? "#CE0037" : "white"}
            isDisabled={isLoading}
            transition="all 0.15s ease-out"
          />
        </MotionBox>
      ))}
    </HStack>
  );
}

export default function AdminResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mfaStep, setMfaStep] = useState<"reset" | "2fa">("reset");
  const [email, setEmail] = useState("");
  const [isInvite, setIsInvite] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const { data: authPolicy } = trpc.public.getAuthPolicy.useQuery();
  const syncPasswordChange = trpc.admin.syncPasswordChange.useMutation();

  useEffect(() => {
    const checkSession = async () => {
      // Check if we are in an invite flow
      if (window.location.hash.includes("type=invite")) {
        setIsInvite(true);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired link. Please request a new one.");
      } else {
        setEmail(session.user.email || "");
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/admin/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError("Please enter a new password."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      const isMfaRequired = authPolicy?.isMfaRequired !== false;
      if (isMfaRequired) {
        // Send OTP for verification before finalizing
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false }
        });
        if (otpError) throw otpError;
        setMfaStep("2fa");
        toast({
          title: "MFA Verification Required",
          description: "A verification code has been sent to your email to confirm this password change.",
          status: "info",
        });
      } else {
        // Backend Sync
        await syncPasswordChange.mutateAsync();
        
        setSuccess(true);
        toast({
          title: isInvite ? "Account Set Up" : "Password Updated",
          description: isInvite ? "Your administrator account is ready. Redirecting..." : "Your password has been reset successfully. Redirecting...",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length < 8) { setError("Please enter the complete 8-digit code."); return; }
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      });

      if (verifyError) throw verifyError;

      // Backend Sync
      await syncPasswordChange.mutateAsync();

      setSuccess(true);
      toast({
        title: "Verified",
        description: "Password reset finalized successfully.",
        status: "success",
      });
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
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
          <MotionHeading color="white" size="lg" fontWeight="800">
            {isInvite ? "Setup Complete" : "Password Reset Successful"}
          </MotionHeading>
          <MotionText color="gray.400" fontSize="md">Redirecting to Sign In...</MotionText>
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
              {isInvite ? "Set Up Account" : "Secure Your Account"}
            </MotionHeading>
            <MotionText fontSize="lg" color="whiteAlpha.800" maxW="380px" lineHeight="1.6">
              {isInvite 
                ? "Create a secure password to activate your Clin Solutions L.L.C. administrator account." 
                : "Regain access to the Clin Solutions L.L.C. Drug Safety Reporting Portal with a strong new password."}
            </MotionText>
          </VStack>
        </VStack>

        <VStack align="start" spacing={4} position="relative">
          {[
            { icon: Shield, label: "Advanced security protocols" },
            { icon: Lock, label: "Encrypted credential update" },
            { icon: Activity, label: "System access verified" },
          ].map(({ icon: Icon, label }) => (
            <HStack key={label} spacing={3}>
              <Box w="32px" h="32px" borderRadius="10px" bg="whiteAlpha.100" display="flex" alignItems="center" justifyContent="center">
                <Icon size={14} color="rgba(255,255,255,0.9)" />
              </Box>
              <Text fontSize="13px" color="whiteAlpha.800" fontWeight="500">{label}</Text>
            </HStack>
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
            {/* Mobile Branding */}
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
              {mfaStep === "reset" ? (
                <MotionVStack
                  key="reset-form"
                  spacing={7}
                  align="stretch"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  as="form"
                  onSubmit={handleUpdatePassword}
                >
                  <VStack align="start" spacing={2}>
                    <Heading size="lg" color="white" fontWeight="800" letterSpacing="-0.5px">
                      {isInvite ? "Create Password" : "Reset Password"}
                    </Heading>
                    <Text color="#64748b" fontSize="sm">
                      Enter a strong password to continue
                    </Text>
                  </VStack>

                  {error && (
                    <Alert status="error" borderRadius="16px" bg="#1e0a0a" color="#f87171" border="1px solid" borderColor="#7f1d1d" py={3}>
                      <AlertIcon color="#ef4444" />
                      <Text fontSize="sm" fontWeight="500">{error}</Text>
                    </Alert>
                  )}

                  <VStack spacing={5} align="stretch">
                    <FormControl>
                      <FormLabel color="#64748b" fontSize="11px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>NEW PASSWORD</FormLabel>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Lock size={16} color="#475569" />
                        </InputLeftElement>
                        <Input
                          autoComplete="new-password"
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(""); }}
                          bg="rgba(30, 41, 59, 0.5)"
                          border="1px solid"
                          borderColor="whiteAlpha.100"
                          _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 2px rgba(206, 0, 55, 0.2)" }}
                          _hover={{ borderColor: "whiteAlpha.300" }}
                          color="white"
                          borderRadius="16px"
                          fontSize="16px"
                          h="52px"
                          px={12}
                          placeholder="••••••••"
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

                    <FormControl>
                      <FormLabel color="#64748b" fontSize="11px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>CONFIRM PASSWORD</FormLabel>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Lock size={16} color="#475569" />
                        </InputLeftElement>
                        <Input
                          autoComplete="new-password"
                          type={showPass ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                          bg="rgba(30, 41, 59, 0.5)"
                          border="1px solid"
                          borderColor="whiteAlpha.100"
                          _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 2px rgba(206, 0, 55, 0.2)" }}
                          _hover={{ borderColor: "whiteAlpha.300" }}
                          color="white"
                          borderRadius="16px"
                          fontSize="16px"
                          h="52px"
                          px={12}
                          placeholder="••••••••"
                        />
                      </InputGroup>
                    </FormControl>

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
                      transition="all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                    >
                      Continue
                    </Button>
                  </VStack>
                </MotionVStack>
              ) : (
                <MotionVStack
                  key="otp-form"
                  spacing={10}
                  align="stretch"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <VStack align="start" spacing={4}>
                    <Box bg="white" p={2.5} borderRadius="14px" border="1px solid whiteAlpha.200" boxShadow="sm">
                      <Image src={logo} h={6} w="auto" alt="Clin Solutions L.L.C. Logo" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Heading size="lg" color="white" fontWeight="800" letterSpacing="-0.5px">Verify Identity</Heading>
                      <MotionText color="#64748b" fontSize="sm">
                        Enter the 8-digit code sent to<br />
                        <Text as="span" color="whiteAlpha.800" fontWeight="700">{email}</Text>
                      </MotionText>
                    </VStack>
                  </VStack>

                  {error && (
                    <Alert status="error" borderRadius="16px" bg="#1e0a0a" color="#f87171" border="1px solid" borderColor="#7f1d1d">
                      <AlertIcon color="#ef4444" />
                      <Text fontSize="sm" fontWeight="500">{error}</Text>
                    </Alert>
                  )}

                  <OtpInput
                    onComplete={handleVerifyOtp}
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
                      onClick={() => {
                        // This fallback is only if they click the button instead of auto-completing
                        // But since we want "fluid" feel, we rely on onComplete
                      }}
                      display="none" // Hide it and rely on auto-complete for better fluidity
                      isLoading={loading}
                      fontWeight="700"
                    >
                      Verify & Finalize
                    </Button>
                    <VStack spacing={3}>
                      <Text fontSize="xs" color="#64748b" fontWeight="600">
                        Didn't receive a code?{" "}
                        <Text as="span" color="#CE0037" cursor="pointer" onClick={() => {}} fontWeight="800">Resend</Text>
                      </Text>
                    </VStack>
                  </VStack>
                </MotionVStack>
              )}
            </AnimatePresence>

            <Button
              variant="ghost"
              size="sm"
              color="#64748b"
              _hover={{ color: "white", bg: "whiteAlpha.100" }}
              onClick={() => navigate("/admin/login")}
              fontSize="12px"
              leftIcon={<ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />}
            >
              Back to login
            </Button>
          </VStack>
        </MotionBox>
      </Flex>
    </Flex>
  );
}