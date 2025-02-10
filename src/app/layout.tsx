import "@/app/globals.css";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { Inter } from "next/font/google";
import { MainNav } from "@/components/shared/main-nav";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav />
          </div>
        </div>
        <main className="container mx-auto py-6">
          <ReactQueryProvider>{children}</ReactQueryProvider>
          <Toaster />
        </main>
      </body>
    </html>
  );
}
