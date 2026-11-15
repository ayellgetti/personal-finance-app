import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Why from "./pages/Why.tsx";
import Guide from "./pages/Guide.tsx";
import Course from "./pages/Course.tsx";
import NotFound from "./pages/NotFound.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/why" element={<Why />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/course" element={<Course />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
