import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import AmplitudeProvider from "@/components/AmplitudeProvider";
import BrazeProvider from "@/components/BrazeProvider";
import GNB from "@/components/GNB";
import Footer from "@/components/Footer";
import ToastWrapper from "@/components/ToastWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TechStore - 최신 기술 제품 쇼핑몰",
  description: "최신 기술 제품을 합리적인 가격으로 제공하는 온라인 쇼핑몰",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AmplitudeProvider>
        <BrazeProvider>
          <StoreProvider>
            <div className="min-h-screen flex flex-col">
              <GNB />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <ToastWrapper />
            </div>
          </StoreProvider>
        </BrazeProvider>
        </AmplitudeProvider>
      </body>
    </html>
  );
}
