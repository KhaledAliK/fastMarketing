const prisma = require("./prisma");
const countries = require("i18n-iso-countries");

countries.registerLocale(require("i18n-iso-countries/langs/ar.json"));
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

async function seedCountries() {
  const countryCodes = countries.getAlpha2Codes();

  for (const code in countryCodes) {
    const nameAr = countries.getName(code, "ar");
    const nameEn = countries.getName(code, "en");

    if (!nameAr || !nameEn) continue;

    const flagUrl = `https://flagcdn.com/w320/${code.toLowerCase()}.png`;

    await prisma.country.upsert({
      where: { code },
      update: {},
      create: {
        code,
        nameAr,
        nameEn,
        flagUrl,
      },
    });
  }

  console.log("✅ Countries seeded successfully.");
  await prisma.$disconnect();
}

seedCountries().catch((err) => {
  console.error("❌ Failed to seed countries:", err);
  prisma.$disconnect();
});
