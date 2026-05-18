import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl({
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
});
