import banquetHtml from "./banquet.html?raw";
import { StaticHtmlPage } from "./StaticHtmlPage";

export default function Banquet() {
  return <StaticHtmlPage html={banquetHtml} title="Banquet enquiry to event booking" />;
}
