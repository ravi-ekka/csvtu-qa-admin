import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { AuthProvider } from "./AuthContext";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
// ‼️ import tiptap styles after core package styles
import '@mantine/tiptap/styles.css';
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://widget.cloudinary.com/v2.0/global/all.js" type="text/javascript" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/rollbar.js/2.11.0/rollbar.min.js" strategy="afterInteractive" />
      </head>
      <body cz-shortcut-listen="true">
        <AuthProvider>
          <MantineProvider forceColorScheme="light">
            <header><Navbar /></header>
            <main className="min-h-[calc(100vh-9rem)] bg-gray-100 flex flex-col relative items-center justify-center overflow-y-auto">
              {children}
            </main>
            <footer><Footer /></footer>
          </MantineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


