"use client"
import React from "react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import Navbar from "@/components/Navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return(
        <div className="h-full w-full">
            <Navbar />
            <main className={`h-full flex w-full flex-col`} style={{ marginTop: `${NAVBAR_HEIGHT}px` }}>
                {children}
            </main>
        </div>
    )
}
export default Layout