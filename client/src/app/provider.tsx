"use client";

import StoreProvider from "@/state/redux";
import dynamic from "next/dynamic";
import { Authenticator } from "@aws-amplify/ui-react";
import Auth from "./(auth)/authProvider";

// Disable SSR for Authenticator to prevent Html import errors
const AuthenticatorProvider = dynamic(
  () => Promise.resolve(({ children }: { children: React.ReactNode }) => (
    <Authenticator.Provider>
      {children}
    </Authenticator.Provider>
  )),
  { ssr: false }
);

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <AuthenticatorProvider>
        <Auth>{children}</Auth>
      </AuthenticatorProvider>
    </StoreProvider>
  );
};

export default Providers;
