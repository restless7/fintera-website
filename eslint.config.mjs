import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  // Generated clients and local data are not hand-maintained application source.
  { ignores: ["prisma/generated/**", ".storage/**", "backups/**", "coverage/**"] },
];

export default config;
