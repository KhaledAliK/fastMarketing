const router = require("express").Router();
const prisma = require("../config/prisma");

router.get("/countries", async (req, res) => {
  const lang = req.headers.lang || "en";

  try {
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        code: true,
        flagUrl: true,
        nameEn: true,
        nameAr: true,
      },
    });

    if (!countries || countries.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "There are no countries" });
    }

    const mappedCountries = countries.map((country) => ({
      id: country.id,
      code: country.code,
      flagUrl: country.flagUrl,
      name: lang === "ar" ? country.nameAr : country.nameEn,
    }));

    return res.status(200).json({ success: true, countries: mappedCountries });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
