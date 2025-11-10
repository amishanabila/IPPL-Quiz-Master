import DataSoalMatematika from "./DataSoalMatematika";
import DataSoalBahasaIndonesia from "./DataSoalBahasaIndonesia";
import DataSoalBahasaInggris from "./DataSoalBahasaInggris";
import DataSoalIPA from "./DataSoalIPA";
import DataSoalIPS from "./DataSoalIPS";
import DataSoalPKN from "./DataSoalPKN";
import DataSoalSeniBudaya from "./DataSoalSeniBudaya";
import DataSoalOlahraga from "./DataSoalOlahraga";

// ✅ Mapping kategori → dataset
export const soalMap = {
  Matematika: DataSoalMatematika,
  "Bahasa Indonesia": DataSoalBahasaIndonesia,
  "Bahasa Inggris": DataSoalBahasaInggris,
  IPA: DataSoalIPA,
  IPS: DataSoalIPS,
  PKN: DataSoalPKN,
  "Seni Budaya": DataSoalSeniBudaya,
  Olahraga: DataSoalOlahraga,
};

export {
  DataSoalMatematika,
  DataSoalBahasaIndonesia,
  DataSoalBahasaInggris,
  DataSoalIPA,
  DataSoalIPS,
  DataSoalPKN,
  DataSoalSeniBudaya,
  DataSoalOlahraga,
};
