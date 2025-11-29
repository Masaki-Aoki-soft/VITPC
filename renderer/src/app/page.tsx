"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const [message, setMessage] = React.useState<string>("No message found");

  React.useEffect(() => {
    if (window.ipc) {
      const unsubscribe = window.ipc.on("message", (message: string) => {
        setMessage(message);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleButtonClick = () => {
    if (window.ipc) {
      // Electron環境の場合
      window.ipc.send("message", "Hello");
    } else {
      // ブラウザ環境の場合
      setMessage("Hello World!");
    }
  };

  return (
    <div>
      <h1>Home - Nextron (basic-lang-javascript)</h1>
      <div>
        <p>
          ⚡ Electron + Next.js ⚡ - <Link href="/next">Go to next page</Link>
        </p>
        <Image
          src="/images/logo.png"
          alt="Logo image"
          width={256}
          height={256}
        />
      </div>
      <div>
        <button onClick={handleButtonClick}>Test IPC</button>
        <p>{message}</p>
      </div>
    </div>
  );
}

