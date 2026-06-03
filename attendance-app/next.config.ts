import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl({
  async headers() {
    return [
      {
        source: "/:locale/event-scan/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
      {
        source: "/:locale/meeting-scan/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
});
