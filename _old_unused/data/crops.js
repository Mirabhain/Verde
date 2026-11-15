// Generated from dataset.csv. Do not retype by hand.
// Nutrient (N, P, K) and pest values are null until they are extracted from the official sources.
export const CROPS = [
  {
    "id": "cili",
    "nameMs": "Cili",
    "nameEn": "Chilli",
    "scientificName": "Capsicum annuum",
    "family": "Solanaceae",
    "category": "Sayuran",
    "lifecycle": "annual",
    "fertiliserFrequency": null,
    "nutrients": {
      "N": null,
      "P": null,
      "K": null
    },
    "pests": null,
    "sourceUrl": "https://epengembangan.doa.gov.my/wp-content/uploads/2023/04/Pakej-Teknologi-Cili-Jabatan-Pertanian-2007.pdf",
    "dataStatus": "Rujukan rasmi tersedia; nilai belum diekstrak"
  },
  {
    "id": "jagung",
    "nameMs": "Jagung",
    "nameEn": "Sweet corn",
    "scientificName": "Zea mays",
    "family": "Poaceae",
    "category": "Bijirin",
    "lifecycle": "annual",
    "fertiliserFrequency": null,
    "nutrients": {
      "N": null,
      "P": null,
      "K": null
    },
    "pests": null,
    "sourceUrl": "https://www.doa.gov.my/doa/resources/aktiviti_sumber/sumber_awam/penerbitan/pakej_teknologi/tnmn_ldg_kontan/pt_jagung_manis_2008.pdf",
    "dataStatus": "Rujukan rasmi tersedia; nilai belum diekstrak"
  },
  {
    "id": "padi",
    "nameMs": "Padi",
    "nameEn": "Rice (paddy)",
    "scientificName": "Oryza sativa",
    "family": "Poaceae",
    "category": "Bijirin",
    "lifecycle": "annual",
    "fertiliserFrequency": null,
    "nutrients": {
      "N": null,
      "P": null,
      "K": null
    },
    "pests": null,
    "sourceUrl": "https://epengembangan.doa.gov.my/tanaman/padi/",
    "dataStatus": "Rujukan rasmi tersedia; nilai belum diekstrak"
  },
  {
    "id": "getah",
    "nameMs": "Getah",
    "nameEn": "Rubber",
    "scientificName": "Hevea brasiliensis",
    "family": "Euphorbiaceae",
    "category": "Tanaman industri",
    "lifecycle": "perennial",
    "fertiliserFrequency": null,
    "nutrients": {
      "N": null,
      "P": null,
      "K": null
    },
    "pests": null,
    "sourceUrl": null,
    "dataStatus": "Sumber DOA/MARDI khusus belum disahkan"
  },
  {
    "id": "durian",
    "nameMs": "Durian",
    "nameEn": "Durian",
    "scientificName": "Durio zibethinus",
    "family": "Malvaceae",
    "category": "Buah-buahan",
    "lifecycle": "perennial",
    "fertiliserFrequency": "4–6 kali setahun (pokok muda); 3–4 kali setahun (pokok matang)",
    "nutrients": {
      "N": null,
      "P": null,
      "K": null
    },
    "pests": null,
    "sourceUrl": "https://epengembangan.doa.gov.my/tanaman/buah-buahann/",
    "dataStatus": "Kekerapan pembajaan disahkan; NPK/perosak belum diekstrak"
  },
  {
    "id": "nanas",
    "nameMs": "Nanas",
    "nameEn": "Pineapple",
    "scientificName": "Ananas comosus",
    "family": "Bromeliaceae",
    "category": "Buah-buahan",
    "lifecycle": "annual",
    "fertiliserFrequency": null,
    "nutrients": {
      "N": null,
      "P": null,
      "K": null
    },
    "pests": null,
    "sourceUrl": "https://www.doa.gov.my/index.php/pages/view/972",
    "dataStatus": "Rujukan rasmi tersedia; nilai belum diekstrak"
  }
];

export const getCrop = (id) => CROPS.find((c) => c.id === id) || null;