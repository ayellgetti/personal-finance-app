import realEstateHtml from "./real-estate.html?raw";
import { StaticHtmlPage } from "./StaticHtmlPage";

export default function RealEstate() {
  return <StaticHtmlPage html={realEstateHtml} title="Real estate sales walkthrough" />;
}
