import freedomHtml from "./freedom.html?raw";
import { StaticHtmlPage } from "./StaticHtmlPage";

export default function Freedom() {
  return <StaticHtmlPage html={freedomHtml} title="Freedom Planner sales walkthrough" />;
}
