import React from "react";
import {Route, Routes} from "react-router-dom";
import LandingPage from "./pages/LandingPage/Index";
import Blocked from "./pages/Blocked/Index";
import NotFoundPage from "./pages/layout/NotFoundPage";
import ExplorerLayout from "./pages/layout";

export default function FaucetRoutes() {
  return (
    <ExplorerLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/blocked" element={<Blocked />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ExplorerLayout>
  );
}
