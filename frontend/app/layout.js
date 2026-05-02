import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "SkillSwap - Exchange Skills, Grow Together",
  description: "A real-time peer-to-peer skill exchange platform where users teach and learn from each other. Find your perfect skill match today.",
  keywords: "skill exchange, peer learning, teach, learn, skill swap, education platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
