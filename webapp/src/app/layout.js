import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata = {
  title: "AidEra",
  description: "A platform to connect NGOs with volunteers and community",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
	  <AppProvider>
        	{children}
	  </AppProvider>
      </body>
    </html>
  );
}
