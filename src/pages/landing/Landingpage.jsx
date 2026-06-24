import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  ArrowRight,
  Lock,
  Send,
  History,
  Shield,
  Users,
  FileText,
  User,
  Download,
  Star,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  // ==================== NAVIGATION ====================
  const Navigation = () => (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center">
            <Lock size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">NeoXe Bank</span>
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {["Home", "Features", "Security", "Reviews", "About Us", "FAQ", "Contact Us"].map(
            (item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                whileHover={{ color: "#06b6d4" }}
                className="text-slate-600 font-medium text-sm transition-colors"
              >
                {item}
              </motion.a>
            )
          )}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <Link to="/login">
                <button className="px-6 py-2 text-slate-900 font-medium hover:bg-slate-100 rounded-lg transition">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition"
                >
                  Register
                </motion.button>
              </Link>
            </>
          ) : (
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition"
              >
                Dashboard
              </motion.button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-slate-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-slate-200 p-6"
        >
          <div className="flex flex-col gap-4">
            {["Home", "Features", "Security", "Reviews", "About Us", "FAQ", "Contact Us"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="text-slate-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              )
            )}
            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
              {!isLoggedIn ? (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-6 py-2 text-slate-900 font-medium hover:bg-slate-100 rounded-lg transition">
                      Login
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium rounded-lg">
                      Register
                    </button>
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium rounded-lg">
                    Dashboard
                  </button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );

  // ==================== HERO SECTION ====================
  const HeroSection = () => (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-20">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Banking Made Simple, Secure & Accessible
          </motion.h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Experience the future of digital banking. Transfer money, manage your finances, and grow your wealth with industry-leading security and zero hassle.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold rounded-lg shadow-xl hover:shadow-2xl flex items-center gap-2 transition"
              >
                Get Started <ArrowRight size={20} />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-slate-900 transition"
              >
                Login
              </motion.button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { number: "50K+", label: "Active Users" },
              { number: "₹100Cr+", label: "Transactions" },
              { number: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * i }}
              >
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  {stat.number}
                </p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right - Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden md:block"
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-indigo-600/30 to-cyan-500/30 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Your Balance</span>
                  <Shield size={20} className="text-cyan-400" />
                </div>
                <p className="text-3xl font-bold text-white">₹1,25,000</p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-indigo-400 to-cyan-400"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
                  {[
                    { icon: Send, label: "Send" },
                    { icon: History, label: "History" },
                    { icon: Download, label: "Export" },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <item.icon className="text-cyan-400 mx-auto mb-2" size={20} />
                      <p className="text-xs text-slate-300">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );

  // ==================== FEATURES SECTION ====================
  const FeaturesSection = () => {
    const features = [
      {
        icon: Send,
        title: "Instant Money Transfers",
        description: "Send money instantly to any account with zero fees",
      },
      {
        icon: History,
        title: "Scheduled Transfers",
        description: "Schedule transfers in advance for your convenience",
      },
      {
        icon: FileText,
        title: "Transaction History",
        description: "Track all your transactions in one place",
      },
      {
        icon: Lock,
        title: "Secure Authentication",
        description: "Military-grade encryption protects your account",
      },
      {
        icon: Shield,
        title: "KYC Verification",
        description: "Quick and simple identity verification process",
      },
      {
        icon: User,
        title: "Profile Management",
        description: "Update your profile and preferences anytime",
      },
      {
        icon: Download,
        title: "Download Statements",
        description: "Get your account statements in PDF format",
      },
      {
        icon: Users,
        title: "Beneficiary Management",
        description: "Manage your trusted contacts easily",
      },
    ];

    return (
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-cyan-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Powerful Features
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need for Banking
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Experience a complete banking ecosystem with features designed for modern financial management
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -10 }}
                className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // ==================== SECURITY SECTION ====================
  const SecuritySection = () => {
    const securityFeatures = [
      { title: "256-bit Encryption", description: "Military-grade encryption for all data" },
      { title: "Multi-factor Authentication", description: "Additional security layers for your account" },
      { title: "Fraud Detection", description: "Real-time anomaly detection system" },
      { title: "Secure Transactions", description: "End-to-end encrypted communications" },
      { title: "Data Privacy Protection", description: "GDPR compliant data handling" },
    ];

    return (
      <section id="security" className="py-20 px-6 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-3">
              Your Trust Matters
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Bank-Grade Security
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              We use the latest security technologies to protect your finances
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {securityFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Check size={20} className="text-cyan-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-indigo-600/20 to-cyan-500/20 border border-indigo-500/50 rounded-xl p-12 text-center"
          >
            <p className="text-slate-300 mb-6">Trusted by leading organizations</p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {["ISO 27001", "SOC 2 Certified", "GDPR Compliant", "RBI Approved"].map((badge) => (
                <div key={badge} className="text-white font-semibold text-sm px-4 py-2 bg-white/10 rounded-lg">
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    );
  };

  // ==================== STATISTICS SECTION ====================
  const StatisticsSection = () => {
    const stats = [
      { number: 50000, label: "Active Users", suffix: "+" },
      { number: 100, label: "Transactions Processed", suffix: "Cr+" },
      { number: 99.9, label: "Uptime Guarantee", suffix: "%" },
      { number: 24, label: "Customer Support", suffix: "/7" },
    ];

    return (
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              By The Numbers
            </h2>
            <p className="text-xl text-slate-600">
              Real metrics from our growing platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 1 }}
                  className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 mb-2"
                >
                  {stat.number}
                </motion.p>
                <p className="text-slate-600 font-medium">{stat.label}</p>
                <p className="text-sm text-slate-500">{stat.suffix}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // ==================== TESTIMONIALS SECTION ====================
  const TestimonialsSection = () => {
    const testimonials = [
      {
        name: "Priya Singh",
        role: "Software Engineer",
        image: "👩‍💼",
        rating: 5,
        review: "NeoXe Bank has completely changed how I manage my finances. The scheduled transfers feature is a game-changer!",
      },
      {
        name: "Raj Patel",
        role: "Entrepreneur",
        image: "👨‍💼",
        rating: 5,
        review: "Secure, fast, and reliable. I've recommended NeoXe Bank to all my friends and colleagues.",
      },
      {
        name: "Ananya Sharma",
        role: "Freelancer",
        image: "👩‍🎨",
        rating: 5,
        review: "The best digital banking experience I've had. Customer support is responsive and helpful.",
      },
      {
        name: "Vikram Kumar",
        role: "Business Owner",
        image: "👨‍🏢",
        rating: 5,
        review: "Perfect for managing business finances. The transaction history and statements are super helpful.",
      },
      {
        name: "Neha Gupta",
        role: "Student",
        image: "👩‍🎓",
        rating: 5,
        review: "Easy to use, secure, and no hidden charges. Exactly what I was looking for!",
      },
      {
        name: "Arjun Desai",
        role: "Finance Professional",
        image: "👨‍💼",
        rating: 5,
        review: "The integration with my other financial apps is seamless. Highly recommended!",
      },
    ];

    const visibleTestimonials = [
      testimonials[testimonialIndex],
      testimonials[(testimonialIndex + 1) % testimonials.length],
      testimonials[(testimonialIndex + 2) % testimonials.length],
    ];

    return (
      <section id="reviews" className="py-20 px-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-cyan-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Customer Stories
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Loved by Our Customers
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {visibleTestimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">"{testimonial.review}"</p>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{testimonial.image}</span>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Carousel Controls */}
          <div className="flex justify-center items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() =>
                setTestimonialIndex(
                  (prev) => (prev - 1 + testimonials.length) % testimonials.length
                )
              }
              className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <ChevronLeft size={20} />
            </motion.button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <motion.div
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                    i === testimonialIndex % testimonials.length
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-500 w-8"
                      : "bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setTestimonialIndex((prev) => (prev + 1) % testimonials.length)}
              className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>
        </div>
      </section>
    );
  };

  // ==================== ABOUT US SECTION ====================
  const AboutSection = () => (
    <section id="about-us" className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-cyan-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Our Story
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Modern Banking for Everyone
          </h2>
          <div className="space-y-4 mb-8">
            <p className="text-lg text-slate-700">
              Founded in 2020, NeoXe Bank was born with a mission to democratize digital banking and make it accessible to everyone.
            </p>
            <p className="text-lg text-slate-700">
              We believe banking should be simple, transparent, and secure. No hidden charges. No unnecessary complexity. Just honest financial services.
            </p>
          </div>

          {/* Core Values */}
          <div className="space-y-3">
            {[
              { title: "Trust", desc: "Your security is our priority" },
              { title: "Innovation", desc: "We continuously improve our services" },
              { title: "Accessibility", desc: "Banking for everyone, everywhere" },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <Check className="text-cyan-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-bold text-slate-900">{value.title}</p>
                  <p className="text-slate-600">{value.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right - Stats */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          {[
            { number: "4+", label: "Years of Service" },
            { number: "50K+", label: "Happy Customers" },
            { number: "₹500Cr+", label: "Volume Processed" },
            { number: "99.9%", label: "Uptime SLA" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ x: 10 }}
              className="bg-gradient-to-br from-indigo-50 to-cyan-50 border border-indigo-100 rounded-lg p-6"
            >
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 mb-2">
                {stat.number}
              </p>
              <p className="text-slate-700 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );

  // ==================== FAQ SECTION ====================
  const FaqSection = () => {
    const faqs = [
      {
        q: "How secure is NeoXe Bank?",
        a: "We use 256-bit encryption, multi-factor authentication, and real-time fraud detection. Your data is protected with the same security standards used by major financial institutions.",
      },
      {
        q: "Can I schedule transfers?",
        a: "Yes! You can schedule transfers for a future date and time. Simply enter the recipient details and choose your preferred date and time.",
      },
      {
        q: "Is KYC mandatory?",
        a: "Yes, KYC (Know Your Customer) is required by RBI regulations. Our KYC process is quick and can be completed within minutes through our mobile app.",
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the login page. You'll receive an email with a reset link. Follow the instructions to create a new password.",
      },
      {
        q: "How do I contact support?",
        a: "You can reach our 24/7 customer support team via email (support@neoxebank.com) or phone. We're always here to help!",
      },
      {
        q: "Are there any transaction fees?",
        a: "We offer zero-fee transfers to other NeoXe Bank accounts. Some external transfers may have minimal charges, which will be disclosed upfront.",
      },
    ];

    return (
      <section id="faq" className="py-20 px-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-cyan-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Questions
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition"
                >
                  <span className="font-semibold text-slate-900 text-left">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: activeFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={20} className="text-slate-600" />
                  </motion.div>
                </button>

                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={
                    activeFaq === i
                      ? { opacity: 1, height: "auto" }
                      : { opacity: 0, height: 0 }
                  }
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <p className="text-slate-700">{faq.a}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // ==================== CONTACT SECTION ====================
  const ContactSection = () => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
      e.preventDefault();
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setFormData({ name: "", email: "", subject: "", message: "" });
    };

    return (
      <section id="contact-us" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-cyan-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Get In Touch
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              We'd Love to Hear From You
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.form
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Message
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition resize-none"
                  rows="5"
                  placeholder="Your message..."
                ></textarea>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
              >
                Send Message
              </motion.button>

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 font-semibold"
                >
                  ✓ Message sent successfully!
                </motion.div>
              )}
            </motion.form>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {[
                {
                  icon: Mail,
                  title: "Email",
                  content: "support@neoxebank.com",
                  link: "mailto:support@neoxebank.com",
                },
                {
                  icon: Phone,
                  title: "Phone",
                  content: "+91 1800-NEOXE-1",
                  link: "tel:+911800639693",
                },
                {
                  icon: MapPin,
                  title: "Address",
                  content: "123 Financial Street, Mumbai, India",
                  link: null,
                },
              ].map((contact, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 10 }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <contact.icon className="text-indigo-600" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 mb-1">{contact.title}</p>
                    {contact.link ? (
                      <a href={contact.link} className="text-cyan-600 hover:text-cyan-700">
                        {contact.content}
                      </a>
                    ) : (
                      <p className="text-slate-600">{contact.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Social Links */}
              <div>
                <p className="font-bold text-slate-900 mb-4">Follow Us</p>
                <div className="flex gap-4">
                  {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                    <motion.a
                      key={i}
                      href="#"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-indigo-600 hover:to-cyan-500 hover:text-white transition"
                    >
                      <Icon size={20} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  };

  // ==================== FOOTER ====================
  const Footer = () => (
    <footer className="bg-slate-900 text-slate-300 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <Lock size={16} className="text-white" />
              </div>
              <span className="font-bold text-white">NeoXe Bank</span>
            </div>
            <p className="text-sm text-slate-400">
              Modern banking for modern people
            </p>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Security", "Pricing", "Mobile App"],
            },
            {
              title: "Company",
              links: ["About Us", "Blog", "Careers", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy Policy", "Terms & Conditions", "KYC Policy"],
            },
            {
              title: "Support",
              links: ["FAQ", "Help Center", "Contact Support"],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="font-semibold text-white mb-4">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © 2024 NeoXe Bank. All rights reserved.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.2 }}
                  className="hover:text-white transition"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div className="bg-white">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <SecuritySection />
      <StatisticsSection />
      <TestimonialsSection />
      <AboutSection />
      <FaqSection />
      <ContactSection />
      <Footer />
    </div>
  );
}