import React from "react";
import {Route, Routes} from "react-router-dom";
import LandingPage from "./pages/LandingPage/Index";
import NotFoundPage from "./pages/layout/NotFoundPage";
import ExplorerLayout from "./pages/layout";
// import ValidatorsPage from "./pages/Validators/Index";
// import ValidatorPage from "./pages/DelegatoryValidator";
// import AnalyticsPage from "./pages/Analytics/Index";

export default function ExplorerRoutes() {
  return (
    <ExplorerLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ExplorerLayout>
  );
}
