/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // jspdf optionally requires dompurify which is not needed for PDF generation
    config.resolve.fallback = {
      ...config.resolve.fallback,
      dompurify: false,
    };
    return config;
  },
};

export default nextConfig;
